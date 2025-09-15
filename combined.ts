// DynamicApp.tsx - Fully Dynamic Configuration-Driven 3NF Data Entry System
import React, { useState, useEffect, useMemo } from 'react';
import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// Type Definitions
interface Field {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'email' | 'select';
  required: boolean;
  options?: { value: string; label: string }[]; // For select fields
}

interface TableConfig {
  name: string;
  level: number;
  parentTable?: string;
  businessKeys: string[];
  fields: Field[];
  displayField: string;
  apiEndpoint?: string; // Optional custom endpoint
}

interface SubdomainConfig {
  name: string;
  mainTable: string;
  tables: Record<string, TableConfig>;
}

interface DomainConfig {
  name: string;
  subdomains: Record<string, SubdomainConfig>;
}

interface PageConfig {
  domain: string;
  subdomain: string;
  config: SubdomainConfig;
}

interface TableRecord {
  id: number;
  [key: string]: any;
}

interface FormState {
  [tableName: string]: TableRecord | null;
}

interface SubmitResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Dynamic API Service
class DynamicApiService {
  // Get page configuration for specific domain/subdomain
  async getPageConfig(domain: string, subdomain: string): Promise<PageConfig> {
    const response: AxiosResponse<PageConfig> = await axios.get(
      `${API_BASE_URL}/config/${domain}/${subdomain}`
    );
    return response.data;
  }

  // Generic table operations
  async getTableData(tableName: string, filters?: Record<string, any>): Promise<TableRecord[]> {
    const response: AxiosResponse<TableRecord[]> = await axios.get(
      `${API_BASE_URL}/tables/${tableName}`,
      { params: filters }
    );
    // Handle both array and object response formats
    return Array.isArray(response.data) ? response.data : response.data.data || [];
  }

  async createRecord(tableName: string, data: any): Promise<TableRecord> {
    const response: AxiosResponse<TableRecord> = await axios.post(
      `${API_BASE_URL}/tables/${tableName}`,
      data
    );
    return response.data;
  }

  async updateRecord(tableName: string, id: number, data: any): Promise<TableRecord> {
    const response: AxiosResponse<TableRecord> = await axios.put(
      `${API_BASE_URL}/tables/${tableName}/${id}`,
      data
    );
    return response.data;
  }

  async deleteRecord(tableName: string, id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/tables/${tableName}/${id}`);
  }

  // Submit complete form hierarchy
  async submitFormData(domain: string, subdomain: string, data: FormState): Promise<any> {
    const response = await axios.post(
      `${API_BASE_URL}/submit/${domain}/${subdomain}`,
      data
    );
    return response.data;
  }
}

const apiService = new DynamicApiService();

// Form Field Component - Completely Dynamic
const DynamicFormField: React.FC<{
  field: Field;
  value: any;
  onChange: (fieldName: string, value: any) => void;
  error?: string;
}> = ({ field, value, onChange, error }) => {
  const renderInput = () => {
    const baseClassName = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500";
    
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            className={baseClassName}
            value={value || ''}
            onChange={(e) => onChange(field.name, e.target.value)}
            required={field.required}
            rows={3}
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            className={baseClassName}
            value={value || ''}
            onChange={(e) => onChange(field.name, e.target.value ? parseFloat(e.target.value) : '')}
            required={field.required}
            step="any"
          />
        );
      
      case 'date':
        return (
          <input
            type="date"
            className={baseClassName}
            value={value || ''}
            onChange={(e) => onChange(field.name, e.target.value)}
            required={field.required}
          />
        );
      
      case 'email':
        return (
          <input
            type="email"
            className={baseClassName}
            value={value || ''}
            onChange={(e) => onChange(field.name, e.target.value)}
            required={field.required}
          />
        );
      
      case 'select':
        return (
          <select
            className={baseClassName}
            value={value || ''}
            onChange={(e) => onChange(field.name, e.target.value)}
            required={field.required}
          >
            <option value="">-- Select --</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );
      
      default:
        return (
          <input
            type="text"
            className={baseClassName}
            value={value || ''}
            onChange={(e) => onChange(field.name, e.target.value)}
            required={field.required}
          />
        );
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderInput()}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

// Dynamic Table Form
const DynamicTableForm: React.FC<{
  tableConfig: TableConfig;
  tableName: string;
  parentId?: number;
  parentField?: string;
  onSave: (record: TableRecord) => void;
  onCancel: () => void;
}> = ({ tableConfig, tableName, parentId, parentField, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    setErrors(prev => ({ ...prev, [fieldName]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    tableConfig.fields.forEach(field => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const dataToSave = { ...formData };
      if (parentId && parentField) {
        dataToSave[parentField] = parentId;
      }

      const savedRecord = await apiService.createRecord(tableName, dataToSave);
      onSave(savedRecord);
    } catch (error: any) {
      console.error('Error saving:', error);
      alert(error.response?.data?.detail || 'Error saving record');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">
        Add New {tableConfig.name}
      </h3>

      {tableConfig.fields.map(field => (
        <DynamicFormField
          key={field.name}
          field={field}
          value={formData[field.name]}
          onChange={handleFieldChange}
          error={errors[field.name]}
        />
      ))}

      <div className="flex gap-3 mt-6">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// Dynamic Data Browser
const DynamicDataBrowser: React.FC<{
  tableName: string;
  tableConfig: TableConfig;
  parentId?: number;
  parentField?: string;
  onSelect: (record: TableRecord) => void;
  showAll: boolean;
  onToggleShowAll: (checked: boolean) => void;
}> = ({ tableName, tableConfig, parentId, parentField, onSelect, showAll, onToggleShowAll }) => {
  const [data, setData] = useState<TableRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [showAll, parentId, tableName]);

  const loadData = async () => {
    setLoading(true);
    try {
      const filters: Record<string, any> = {};
      if (!showAll && parentId && parentField) {
        filters[parentField] = parentId;
      }
      
      const result = await apiService.getTableData(tableName, filters);
      setData(result);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return <div className="text-center py-8 text-gray-500">No data available</div>;
  }

  return (
    <div>
      {tableConfig.parentTable && (
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => onToggleShowAll(e.target.checked)}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">
              Show all {tableConfig.name}s across all {tableConfig.parentTable}
            </span>
          </label>
        </div>
      )}
      
      <div className="overflow-x-auto shadow-sm border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              {tableConfig.fields.map(field => (
                <th key={field.name} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {field.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map(item => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">
                  <button
                    onClick={() => onSelect(item)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Select
                  </button>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {item.id}
                </td>
                {tableConfig.fields.map(field => (
                  <td key={field.name} className="px-4 py-3 text-sm text-gray-900">
                    {field.type === 'textarea' && item[field.name]?.length > 50
                      ? item[field.name].substring(0, 50) + '...'
                      : item[field.name]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Dynamic Level Selector
const DynamicLevelSelector: React.FC<{
  tableName: string;
  tableConfig: TableConfig;
  formState: FormState;
  onUpdate: (tableName: string, data: TableRecord | null) => void;
  allTables: Record<string, TableConfig>;
}> = ({ tableName, tableConfig, formState, onUpdate, allTables }) => {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<TableRecord[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedValue, setSelectedValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'select' | 'browse'>('select');
  const [showAllRecords, setShowAllRecords] = useState(false);

  const parentTableName = tableConfig.parentTable;
  const parentField = parentTableName ? `${parentTableName.slice(0, -1)}_id` : undefined;

  useEffect(() => {
    if (activeTab === 'select') {
      loadOptions();
    }
  }, [formState, tableName]);

  useEffect(() => {
    if (formState[tableName]) {
      setSelectedValue(formState[tableName]!.id.toString());
    } else {
      setSelectedValue('');
    }
  }, [formState, tableName]);

  const loadOptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: Record<string, any> = {};
      if (parentTableName && formState[parentTableName]) {
        filters[parentField!] = formState[parentTableName]!.id;
      }
      
      const data = await apiService.getTableData(tableName, filters);
      setOptions(data);
    } catch (error) {
      console.error('Error loading options:', error);
      setError('Failed to load options');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (value: string) => {
    if (value === 'add_new') {
      setShowAddForm(true);
    } else if (value) {
      const selected = options.find(opt => opt.id === parseInt(value));
      if (selected) {
        onUpdate(tableName, selected);
        setSelectedValue(value);
      }
    } else {
      onUpdate(tableName, null);
      setSelectedValue('');
    }
  };

  const handleSaveNew = (newRecord: TableRecord) => {
    setOptions(prev => [...prev, newRecord]);
    onUpdate(tableName, newRecord);
    setShowAddForm(false);
    setSelectedValue(newRecord.id.toString());
    setActiveTab('select');
  };

  const handleBrowseSelect = (record: TableRecord) => {
    onUpdate(tableName, record);
    setSelectedValue(record.id.toString());
    setActiveTab('select');
  };

  return (
    <div className="mb-6 p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-3 text-gray-700">
        {tableConfig.name} Selection
        {parentTableName && !formState[parentTableName] && (
          <span className="text-sm font-normal text-gray-500 ml-2">
            (Select {allTables[parentTableName]?.name || parentTableName} first)
          </span>
        )}
      </h3>

      <div className="flex mb-4 border-b">
        <button
          onClick={() => setActiveTab('select')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'select' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Select/Add
        </button>
        <button
          onClick={() => setActiveTab('browse')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'browse' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Browse Existing
        </button>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {activeTab === 'select' ? (
        !showAddForm ? (
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Select or Add {tableConfig.name}
            </label>
            <select
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              value={selectedValue}
              onChange={(e) => handleSelect(e.target.value)}
              disabled={loading || (!!parentTableName && !formState[parentTableName])}
            >
              <option value="">-- Select {tableConfig.name} --</option>
              {options.map(opt => (
                <option key={opt.id} value={opt.id}>
                  {opt[tableConfig.displayField] || `${tableConfig.name} #${opt.id}`}
                </option>
              ))}
              <option value="add_new">+ Add New {tableConfig.name}</option>
            </select>

            {formState[tableName] && (
              <div className="mt-3 p-3 bg-white rounded border">
                <p className="text-sm text-gray-600 mb-1">Selected:</p>
                <p className="font-medium text-gray-900">
                  {formState[tableName]![tableConfig.displayField] || `ID: ${formState[tableName]!.id}`}
                </p>
                <div className="mt-2 space-y-1">
                  {tableConfig.businessKeys.map(key => (
                    <p key={key} className="text-sm text-gray-600">
                      <span className="font-medium">{key}:</span> {formState[tableName]![key]}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <DynamicTableForm
            tableConfig={tableConfig}
            tableName={tableName}
            parentId={formState[parentTableName!]?.id}
            parentField={parentField}
            onSave={handleSaveNew}
            onCancel={() => setShowAddForm(false)}
          />
        )
      ) : (
        <DynamicDataBrowser
          tableName={tableName}
          tableConfig={tableConfig}
          parentId={formState[parentTableName!]?.id}
          parentField={parentField}
          onSelect={handleBrowseSelect}
          showAll={showAllRecords}
          onToggleShowAll={setShowAllRecords}
        />
      )}
    </div>
  );
};

// Dynamic Data Entry Page
const DynamicDataEntryPage: React.FC<{
  pageConfig: PageConfig;
}> = ({ pageConfig }) => {
  const [formState, setFormState] = useState<FormState>({});
  const [currentStep, setCurrentStep] = useState<number>(3); // Start from highest level
  const [submitting, setSubmitting] = useState(false);
  const [submitResponse, setSubmitResponse] = useState<SubmitResponse | null>(null);

  const config = pageConfig.config;
  
  // Dynamically sort tables by level
  const sortedTables = useMemo(() => {
    return Object.entries(config.tables)
      .sort(([, a], [, b]) => b.level - a.level)
      .map(([name, tableConfig]) => ({
        tableName: name,
        ...tableConfig
      }));
  }, [config]);

  // Dynamically determine the highest level
  const maxLevel = useMemo(() => {
    return Math.max(...Object.values(config.tables).map(t => t.level));
  }, [config]);

  // Initialize current step to max level
  useEffect(() => {
    setCurrentStep(maxLevel);
  }, [maxLevel]);

  const currentTable = useMemo(() => {
    return sortedTables.find(t => t.level === currentStep);
  }, [sortedTables, currentStep]);

  const handleLevelUpdate = (tableName: string, data: TableRecord | null) => {
    setFormState(prev => ({
      ...prev,
      [tableName]: data
    }));

    // Clear lower level selections when parent changes
    const currentTableConfig = config.tables[tableName];
    const lowerLevelTableNames = Object.entries(config.tables)
      .filter(([_, t]) => t.level < currentTableConfig.level)
      .map(([name]) => name);

    if (lowerLevelTableNames.length > 0) {
      setFormState(prev => {
        const newState = { ...prev };
        lowerLevelTableNames.forEach(name => delete newState[name]);
        return newState;
      });
    }
  };

  const handleSaveAndNext = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitResponse(null);
    try {
      const result = await apiService.submitFormData(
        pageConfig.domain,
        pageConfig.subdomain,
        formState
      );
      
      setSubmitResponse({
        success: true,
        message: 'Data submitted successfully!',
        data: result
      });

      // Reset form after successful submission
      setTimeout(() => {
        setFormState({});
        setCurrentStep(maxLevel);
        setSubmitResponse(null);
      }, 3000);
    } catch (error: any) {
      console.error('Error submitting:', error);
      setSubmitResponse({
        success: false,
        message: error.response?.data?.message || 'Error submitting data. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = currentTable && formState[currentTable.tableName] !== null;
  const isLastStep = currentStep === 1;
  const isFirstStep = currentStep === maxLevel;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          {config.name}
        </h2>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {sortedTables.map((table, idx) => (
              <div key={table.tableName} className="flex-1">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold transition-colors
                    ${table.level >= currentStep ? 'bg-blue-500' : 'bg-gray-300'}`}>
                    {sortedTables.length - idx}
                  </div>
                  {idx < sortedTables.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 transition-colors
                      ${table.level > currentStep ? 'bg-blue-500' : 'bg-gray-300'}`} />
                  )}
                </div>
                <p className="text-sm mt-2 text-center">{table.name}</p>
              </div>
            ))}
          </div>
        </div>

        {submitResponse && (
          <div className={`mb-6 p-4 rounded-lg ${
            submitResponse.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {submitResponse.message}
          </div>
        )}

        {/* Current Step Form */}
        <div className="mb-6">
          {sortedTables.map(table => (
            <div key={table.tableName} className={table.level !== currentStep ? 'hidden' : ''}>
              <DynamicLevelSelector
                tableName={table.tableName}
                tableConfig={table}
                formState={formState}
                onUpdate={handleLevelUpdate}
                allTables={config.tables}
              />
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep(currentStep + 1)}
            disabled={isFirstStep}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex gap-3">
            {!isLastStep && (
              <button
                onClick={handleSaveAndNext}
                disabled={!canProceed}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save & Next
              </button>
            )}

            <button
              onClick={handleSubmit}
              disabled={!canProceed || submitting}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit All'}
            </button>
          </div>
        </div>

        {/* Debug Info */}
        <details className="mt-8">
          <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
            View Form State (Debug)
          </summary>
          <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
            {JSON.stringify(formState, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
};

// Main Dynamic App Component
const DynamicApp: React.FC = () => {
  const [pageConfig, setPageConfig] = useState<PageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // These would come from URL params or props in a real app
  const domain = 'inventory';
  const subdomain = 'product_entry';

  useEffect(() => {
    loadPageConfiguration();
  }, [domain, subdomain]);

  const loadPageConfiguration = async () => {
    try {
      setLoading(true);
      setError(null);
      const config = await apiService.getPageConfig(domain, subdomain);
      setPageConfig(config);
    } catch (error: any) {
      console.error('Error loading page configuration:', error);
      setError(error.response?.data?.message || 'Failed to load page configuration');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading configuration...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadPageConfiguration}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!pageConfig) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <p className="text-gray-600">No configuration found for {domain}/{subdomain}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Dynamic 3NF Data Entry System
          </h1>
          <p className="text-gray-600 mt-1">
            {pageConfig.config.name} - {domain}/{subdomain}
          </p>
        </div>
      </header>

      <main className="py-8">
        <DynamicDataEntryPage pageConfig={pageConfig} />
      </main>
    </div>
  );
};

export default DynamicApp;


# simple_dynamic_api.py - Simplified Dynamic Backend that works with the frontend

from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Text, Float, ForeignKey, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime
import json

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./dynamic_3nf.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# FastAPI app
app = FastAPI(title="Dynamic 3NF API", version="2.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SQLAlchemy Models (keeping it simple for now)
class Department(Base):
    __tablename__ = "departments"
    
    id = Column(Integer, primary_key=True, index=True)
    dept_code = Column(String(50), nullable=False, unique=True)
    dept_name = Column(String(100), nullable=False)
    description = Column(Text)
    created_at = Column(String(50), default=lambda: datetime.utcnow().isoformat())

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    category_code = Column(String(50), nullable=False)
    category_name = Column(String(100), nullable=False)
    description = Column(Text)
    created_at = Column(String(50), default=lambda: datetime.utcnow().isoformat())
    
    __table_args__ = (
        UniqueConstraint('category_code', 'department_id', name='uix_category_dept'),
    )

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    product_code = Column(String(50), nullable=False)
    sku = Column(String(50), nullable=False)
    product_name = Column(String(200), nullable=False)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    description = Column(Text)
    created_at = Column(String(50), default=lambda: datetime.utcnow().isoformat())
    
    __table_args__ = (
        UniqueConstraint('product_code', 'sku', 'category_id', name='uix_product_category'),
    )

# Create tables
Base.metadata.create_all(bind=engine)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Table registry
TABLE_MODELS = {
    "departments": Department,
    "categories": Category,
    "products": Product
}

# Configuration
CONFIGURATION = {
    "inventory": {
        "product_entry": {
            "name": "Product Entry",
            "mainTable": "products",
            "tables": {
                "departments": {
                    "name": "Department",
                    "level": 3,
                    "businessKeys": ["dept_code"],
                    "fields": [
                        {"name": "dept_code", "label": "Department Code", "type": "text", "required": True},
                        {"name": "dept_name", "label": "Department Name", "type": "text", "required": True},
                        {"name": "description", "label": "Description", "type": "textarea", "required": False}
                    ],
                    "displayField": "dept_name"
                },
                "categories": {
                    "name": "Category",
                    "level": 2,
                    "parentTable": "departments",
                    "businessKeys": ["category_code"],
                    "fields": [
                        {"name": "category_code", "label": "Category Code", "type": "text", "required": True},
                        {"name": "category_name", "label": "Category Name", "type": "text", "required": True},
                        {"name": "description", "label": "Description", "type": "textarea", "required": False}
                    ],
                    "displayField": "category_name"
                },
                "products": {
                    "name": "Product",
                    "level": 1,
                    "parentTable": "categories",
                    "businessKeys": ["product_code", "sku"],
                    "fields": [
                        {"name": "product_code", "label": "Product Code", "type": "text", "required": True},
                        {"name": "sku", "label": "SKU", "type": "text", "required": True},
                        {"name": "product_name", "label": "Product Name", "type": "text", "required": True},
                        {"name": "price", "label": "Price", "type": "number", "required": True},
                        {"name": "quantity", "label": "Quantity", "type": "number", "required": True},
                        {"name": "description", "label": "Description", "type": "textarea", "required": False}
                    ],
                    "displayField": "product_name"
                }
            }
        }
    }
}

# API Endpoints

@app.get("/api/config/{domain}/{subdomain}")
def get_page_configuration(domain: str, subdomain: str):
    """Get configuration for a specific domain and subdomain"""
    if domain not in CONFIGURATION:
        raise HTTPException(status_code=404, detail=f"Domain '{domain}' not found")
    
    if subdomain not in CONFIGURATION[domain]:
        raise HTTPException(status_code=404, detail=f"Subdomain '{subdomain}' not found")
    
    return {
        "domain": domain,
        "subdomain": subdomain,
        "config": CONFIGURATION[domain][subdomain]
    }

@app.get("/api/tables/{table_name}")
async def get_table_data(
    table_name: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get data from any table with optional filters"""
    if table_name not in TABLE_MODELS:
        raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found")
    
    model = TABLE_MODELS[table_name]
    query = db.query(model)
    
    # Get query parameters
    params = dict(request.query_params)
    
    # Handle parent_id filter
    if 'parent_id' in params:
        parent_id = int(params['parent_id'])
        # Determine the parent field based on table
        if table_name == "categories":
            query = query.filter(model.department_id == parent_id)
        elif table_name == "products":
            query = query.filter(model.category_id == parent_id)
    
    # Handle other specific filters
    if 'department_id' in params and hasattr(model, 'department_id'):
        query = query.filter(model.department_id == int(params['department_id']))
    
    if 'category_id' in params and hasattr(model, 'category_id'):
        query = query.filter(model.category_id == int(params['category_id']))
    
    # Get all records
    records = query.all()
    
    # Convert to dict format
    result = []
    for record in records:
        record_dict = {}
        for column in model.__table__.columns:
            record_dict[column.name] = getattr(record, column.name)
        result.append(record_dict)
    
    return result

@app.post("/api/tables/{table_name}")
def create_table_record(
    table_name: str,
    record_data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Create a record in any table"""
    if table_name not in TABLE_MODELS:
        raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found")
    
    model = TABLE_MODELS[table_name]
    
    try:
        # Create the record
        db_record = model(**record_data)
        db.add(db_record)
        db.commit()
        db.refresh(db_record)
        
        # Convert to dict
        result = {}
        for column in model.__table__.columns:
            result[column.name] = getattr(db_record, column.name)
        
        return result
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/tables/{table_name}/{record_id}")
def update_table_record(
    table_name: str,
    record_id: int,
    record_data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Update a record in any table"""
    if table_name not in TABLE_MODELS:
        raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found")
    
    model = TABLE_MODELS[table_name]
    db_record = db.query(model).filter(model.id == record_id).first()
    
    if not db_record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    try:
        for field, value in record_data.items():
            if hasattr(db_record, field) and field not in ['id', 'created_at']:
                setattr(db_record, field, value)
        
        db.commit()
        db.refresh(db_record)
        
        # Convert to dict
        result = {}
        for column in model.__table__.columns:
            result[column.name] = getattr(db_record, column.name)
        
        return result
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/tables/{table_name}/{record_id}")
def delete_table_record(
    table_name: str,
    record_id: int,
    db: Session = Depends(get_db)
):
    """Delete a record from any table"""
    if table_name not in TABLE_MODELS:
        raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found")
    
    model = TABLE_MODELS[table_name]
    db_record = db.query(model).filter(model.id == record_id).first()
    
    if not db_record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    try:
        db.delete(db_record)
        db.commit()
        return {"message": "Record deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/submit/{domain}/{subdomain}")
def submit_form_data(
    domain: str,
    subdomain: str,
    form_data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Submit complete form data for a domain/subdomain"""
    return {
        "success": True,
        "message": "Data submitted successfully",
        "domain": domain,
        "subdomain": subdomain,
        "timestamp": datetime.utcnow().isoformat(),
        "data": form_data
    }

@app.post("/api/init-sample-data")
def init_sample_data(db: Session = Depends(get_db)):
    """Initialize sample data"""
    try:
        # Check if data already exists
        if db.query(Department).count() > 0:
            return {"message": "Data already exists"}
        
        # Create sample departments
        dept1 = Department(dept_code="ELEC", dept_name="Electronics", description="Electronic items")
        dept2 = Department(dept_code="CLTH", dept_name="Clothing", description="Apparel and accessories")
        db.add_all([dept1, dept2])
        db.commit()
        
        # Create sample categories
        cat1 = Category(
            department_id=dept1.id,
            category_code="COMP",
            category_name="Computers",
            description="Desktop and laptops"
        )
        cat2 = Category(
            department_id=dept1.id,
            category_code="PHON",
            category_name="Phones",
            description="Mobile devices"
        )
        cat3 = Category(
            department_id=dept2.id,
            category_code="MENS",
            category_name="Men's Wear",
            description="Men's clothing"
        )
        db.add_all([cat1, cat2, cat3])
        db.commit()
        
        # Create sample products
        prod1 = Product(
            category_id=cat1.id,
            product_code="LAP001",
            sku="SKU-LAP-001",
            product_name="Laptop Pro",
            price=999.99,
            quantity=10,
            description="High-performance laptop"
        )
        prod2 = Product(
            category_id=cat2.id,
            product_code="PHN001",
            sku="SKU-PHN-001",
            product_name="SmartPhone X",
            price=699.99,
            quantity=25,
            description="Latest smartphone"
        )
        db.add_all([prod1, prod2])
        db.commit()
        
        return {"message": "Sample data initialized successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
