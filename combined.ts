import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, Check, Plus, Edit2, Save, X, Database, 
  Link2, Filter, Search, ArrowRight, Layout, Grid3X3,
  Home, FileText
} from 'lucide-react';

// Type Definitions
interface FilterConfig {
  name: string;
  displayName: string;
  type: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

interface ColumnConfig {
  name: string;
  type: string;
  required?: boolean;
  options?: string[];
  validation?: Record<string, any>;
}

interface RelationshipConfig {
  type: 'one' | 'many';
  parentTable: string;
  parentKeys: string[];
  childKeys: string[];
}

interface TableConfig {
  tableName: string;
  displayName: string;
  businessKeys: string[];
  columns: ColumnConfig[];
  relationships?: RelationshipConfig | null;
}

interface DomainConfig {
  domainName: string;
  displayName: string;
  tables: TableConfig[];
}

interface ViewColumnConfig {
  columnName: string;
  displayName: string;
  width?: string;
  editable?: boolean;
}

interface FrontendViewConfig {
  viewName: string;
  domainName: string;
  filters: FilterConfig[];
  displayColumns: Record<string, ViewColumnConfig[]>;
}

interface BackendConfig {
  domains: DomainConfig[];
}

interface FrontendConfig {
  views: FrontendViewConfig[];
}

interface DataRecord {
  [key: string]: any;
  created_at?: string;
  updated_at?: string;
}

type UIMode = 'sequential' | 'cards';

// API Service
const API_BASE = 'http://localhost:8000/api';

const apiService = {
  getBackendConfig: async (): Promise<BackendConfig> => {
    const response = await fetch(`${API_BASE}/config/backend`);
    return response.json();
  },
  getFrontendConfig: async (): Promise<FrontendConfig> => {
    const response = await fetch(`${API_BASE}/config/frontend`);
    return response.json();
  },
  getDomainConfig: async (domainName: string): Promise<DomainConfig> => {
    const response = await fetch(`${API_BASE}/config/domain/${domainName}`);
    return response.json();
  },
  getData: async (domainName: string, tableName: string): Promise<{ data: DataRecord[] }> => {
    const response = await fetch(`${API_BASE}/data/${domainName}/${tableName}`);
    return response.json();
  },
  saveData: async (domainName: string, tableName: string, data: DataRecord): Promise<{ success: boolean; data: DataRecord }> => {
    const response = await fetch(`${API_BASE}/data/${domainName}/${tableName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },
};

// Common Components
interface FormFieldProps {
  column: ColumnConfig;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

const FormField: React.FC<FormFieldProps> = ({ column, value, onChange, error }) => {
  const renderInput = () => {
    switch (column.type) {
      case 'textarea':
        return (
          <textarea
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            required={column.required}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={column.required}
          />
        );
      case 'date':
        return (
          <input
            type="date"
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={column.required}
          />
        );
      case 'dropdown':
        return (
          <select
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={column.required}
          >
            <option value="">Select...</option>
            {column.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      default:
        return (
          <input
            type="text"
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={column.required}
          />
        );
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {column.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
        {column.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderInput()}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

// Sequential UI Components
interface ProgressMenuProps {
  tables: TableConfig[];
  currentStep: number;
  onStepClick: (step: number) => void;
  completedSteps: number[];
}

const ProgressMenu: React.FC<ProgressMenuProps> = ({ tables, currentStep, onStepClick, completedSteps }) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Progress</h3>
      <div className="space-y-2">
        {tables.map((table, index) => (
          <div
            key={table.tableName}
            className={`flex items-center p-3 rounded cursor-pointer transition-all ${
              currentStep === index
                ? 'bg-blue-100 border-l-4 border-blue-500'
                : completedSteps.includes(index)
                ? 'bg-green-50 hover:bg-green-100'
                : 'hover:bg-gray-100'
            }`}
            onClick={() => onStepClick(index)}
          >
            <div className="flex-1">
              <div className="flex items-center">
                {completedSteps.includes(index) ? (
                  <Check className="w-5 h-5 text-green-600 mr-2" />
                ) : (
                  <div
                    className={`w-5 h-5 rounded-full border-2 mr-2 ${
                      currentStep === index
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}
                  >
                    {currentStep === index && (
                      <div className="w-full h-full rounded-full bg-white scale-50"></div>
                    )}
                  </div>
                )}
                <span className={`font-medium ${
                  currentStep === index ? 'text-blue-700' : 'text-gray-700'
                }`}>
                  {table.displayName}
                </span>
              </div>
              {table.relationships && (
                <span className="text-xs text-gray-500 ml-7">
                  Linked to {table.relationships.parentTable}
                </span>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        ))}
      </div>
    </div>
  );
};

interface DataEntryFormProps {
  table: TableConfig;
  domainName: string;
  parentData: DataRecord | null;
  onSave: (data: DataRecord) => void;
  onCancel: () => void;
}

const DataEntryForm: React.FC<DataEntryFormProps> = ({ table, domainName, parentData, onSave, onCancel }) => {
  const [formData, setFormData] = useState<DataRecord>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [existingRecords, setExistingRecords] = useState<DataRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<DataRecord | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(true);

  useEffect(() => {
    loadExistingData();
    if (table.relationships && parentData) {
      const linkedData: DataRecord = {};
      table.relationships.childKeys.forEach((key, index) => {
        linkedData[key] = parentData[table.relationships!.parentKeys[index]];
      });
      setFormData(linkedData);
    }
  }, [table, parentData]);

  const loadExistingData = async () => {
    try {
      const result = await apiService.getData(domainName, table.tableName);
      setExistingRecords(result.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};
    
    table.columns.forEach((column) => {
      if (column.required && !formData[column.name]) {
        newErrors[column.name] = 'This field is required';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await apiService.saveData(domainName, table.tableName, formData);
      onSave(formData);
      setFormData({});
      setSelectedRecord(null);
      setIsNewRecord(true);
      loadExistingData();
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const handleSelectExisting = (record: DataRecord) => {
    setSelectedRecord(record);
    setFormData(record);
    setIsNewRecord(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold mb-4">{table.displayName}</h3>
      
      {/* Business Key Selection */}
      {!table.relationships && existingRecords.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Select Existing Record or Create New
          </h4>
          <div className="space-y-2">
            <button
              onClick={() => {
                setIsNewRecord(true);
                setFormData({});
                setSelectedRecord(null);
              }}
              className={`w-full text-left px-3 py-2 rounded border ${
                isNewRecord
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-white hover:bg-gray-100'
              }`}
            >
              <Plus className="inline w-4 h-4 mr-2" />
              Create New Record
            </button>
            {existingRecords.map((record, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectExisting(record)}
                className={`w-full text-left px-3 py-2 rounded border ${
                  selectedRecord === record
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-white hover:bg-gray-100'
                }`}
              >
                {table.businessKeys.map((key) => record[key]).join(' - ')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Parent Relationship Info */}
      {table.relationships && parentData && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            Linked to: {table.relationships.parentKeys.map((key) => parentData[key]).join(' - ')}
          </p>
        </div>
      )}

      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {table.columns.map((column) => (
            <FormField
              key={column.name}
              column={column}
              value={formData[column.name]}
              onChange={(value) => {
                setFormData({ ...formData, [column.name]: value });
                setErrors({ ...errors, [column.name]: '' });
              }}
              error={errors[column.name]}
            />
          ))}
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  );
};

interface SequentialDataEntryProps {
  domain: DomainConfig;
}

const SequentialDataEntry: React.FC<SequentialDataEntryProps> = ({ domain }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [savedData, setSavedData] = useState<Record<string, DataRecord>>({});
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [viewConfig, setViewConfig] = useState<FrontendViewConfig | null>(null);

  useEffect(() => {
    loadViewConfig();
  }, [domain]);

  const loadViewConfig = async () => {
    try {
      const config = await apiService.getFrontendConfig();
      const view = config.views.find(v => v.domainName === domain.domainName);
      setViewConfig(view || null);
    } catch (error) {
      console.error('Error loading view config:', error);
    }
  };

  const handleFilterChange = (filterName: string, value: any) => {
    setFilters({ ...filters, [filterName]: value });
  };

  const applyFilters = () => {
    if (!viewConfig) return;
    
    const allRequiredFilters = viewConfig.filters?.filter(f => f.required) || [];
    const missingFilters = allRequiredFilters.filter(f => !filters[f.name]);
    
    if (missingFilters.length > 0) {
      alert(`Please select all required filters: ${missingFilters.map(f => f.displayName).join(', ')}`);
      return;
    }
    
    setFiltersApplied(true);
  };

  const resetFilters = () => {
    setFilters({});
    setFiltersApplied(false);
    setCurrentStep(0);
    setCompletedSteps([]);
    setSavedData({});
  };

  const handleSave = (data: DataRecord) => {
    const currentTable = domain.tables[currentStep];
    // Add filter values to the saved data
    const dataWithFilters = { ...data, ...filters };
    
    setSavedData({
      ...savedData,
      [currentTable.tableName]: dataWithFilters,
    });
    
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    
    if (currentStep < domain.tables.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleStepClick = (step: number) => {
    if (step === 0 || completedSteps.includes(step - 1)) {
      setCurrentStep(step);
    }
  };

  const currentTable = domain.tables[currentStep];
  const parentTable = currentTable.relationships?.parentTable;
  const parentData = parentTable ? savedData[parentTable] : null;

  if (!filtersApplied && viewConfig && viewConfig.filters) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{domain.displayName}</h1>
            <p className="text-gray-600">Please select filters before entering data</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Required Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {viewConfig.filters.map((filter) => (
                <div key={filter.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {filter.displayName}
                    {filter.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {filter.type === 'dropdown' ? (
                    <select
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                      value={filters[filter.name] || ''}
                      onChange={(e) => handleFilterChange(filter.name, e.target.value)}
                    >
                      <option value="">{filter.placeholder || 'Select...'}</option>
                      {filter.options?.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder={filter.placeholder}
                      value={filters[filter.name] || ''}
                      onChange={(e) => handleFilterChange(filter.name, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6">
              <button
                onClick={applyFilters}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Apply Filters & Start Data Entry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{domain.displayName}</h1>
          <p className="text-gray-600">Sequential data entry for linked tables</p>
          
          {/* Active Filters Display */}
          {filtersApplied && viewConfig && viewConfig.filters && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-blue-900">Active Filters: </span>
                  {viewConfig.filters.map((filter, idx) => (
                    <span key={filter.name} className="text-sm text-blue-700">
                      {filter.displayName}: <strong>{filters[filter.name]}</strong>
                      {idx < viewConfig.filters.length - 1 && ', '}
                    </span>
                  ))}
                </div>
                <button
                  onClick={resetFilters}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Change Filters
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <ProgressMenu
              tables={domain.tables}
              currentStep={currentStep}
              onStepClick={handleStepClick}
              completedSteps={completedSteps}
            />
          </div>
          
          <div className="lg:col-span-3">
            <DataEntryForm
              table={currentTable}
              domainName={domain.domainName}
              parentData={parentData}
              onSave={handleSave}
              onCancel={() => {}}
            />
            
            {/* Navigation */}
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className={`px-4 py-2 rounded-md ${
                  currentStep === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                Previous
              </button>
              
              {currentStep === domain.tables.length - 1 && (
                <button
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Complete Entry
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Card-Based UI Components
interface TableCardProps {
  table: TableConfig;
  isActive: boolean;
  isCompleted: boolean;
  onClick: () => void;
  parentData: DataRecord | null;
}

const TableCard: React.FC<TableCardProps> = ({ table, isActive, isCompleted, onClick, parentData }) => {
  const getStatusColor = () => {
    if (isCompleted) return 'border-green-500 bg-green-50';
    if (isActive) return 'border-blue-500 bg-blue-50 shadow-lg';
    return 'border-gray-200 bg-white';
  };

  const getIconColor = () => {
    if (isCompleted) return 'text-green-600';
    if (isActive) return 'text-blue-600';
    return 'text-gray-400';
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-lg border-2 p-6 cursor-pointer transition-all transform hover:scale-[1.02] ${getStatusColor()}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <Database className={`w-6 h-6 mr-3 ${getIconColor()}`} />
          <div>
            <h3 className="font-semibold text-lg">{table.displayName}</h3>
            <p className="text-sm text-gray-600">{table.tableName}</p>
          </div>
        </div>
        {isCompleted && (
          <Check className="w-6 h-6 text-green-600 bg-green-100 rounded-full p-1" />
        )}
      </div>

      {/* Business Keys */}
      <div className="mb-3">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Business Keys</p>
        <div className="flex flex-wrap gap-2">
          {table.businessKeys.map((key) => (
            <span key={key} className="text-sm bg-gray-100 px-2 py-1 rounded">
              {key}
            </span>
          ))}
        </div>
      </div>

      {/* Relationship Info */}
      {table.relationships && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center text-sm text-gray-600">
            <Link2 className="w-4 h-4 mr-2" />
            <span>Linked to: {table.relationships.parentTable}</span>
          </div>
          {parentData && (
            <div className="mt-2 text-xs bg-blue-100 text-blue-700 p-2 rounded">
              Parent: {table.relationships.parentKeys.map(key => parentData[key]).join(' - ')}
            </div>
          )}
        </div>
      )}

      {/* Column Count */}
      <div className="mt-4 flex justify-between items-center">
        <span className="text-sm text-gray-500">
          {table.columns.length} fields
        </span>
        <ArrowRight className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
      </div>
    </div>
  );
};

interface DataEntryModalProps {
  table: TableConfig;
  domainName: string;
  parentData: DataRecord | null;
  onClose: () => void;
  onSave: (data: DataRecord) => void;
}

const DataEntryModal: React.FC<DataEntryModalProps> = ({ table, domainName, parentData, onClose, onSave }) => {
  const [formData, setFormData] = useState<DataRecord>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'new' | 'existing'>('new');
  const [existingRecords, setExistingRecords] = useState<DataRecord[]>([]);

  useEffect(() => {
    loadExistingData();
    if (table.relationships && parentData) {
      const linkedData: DataRecord = {};
      table.relationships.childKeys.forEach((key, index) => {
        linkedData[key] = parentData[table.relationships!.parentKeys[index]];
      });
      setFormData(linkedData);
    }
  }, [table, parentData]);

  const loadExistingData = async () => {
    try {
      const result = await apiService.getData(domainName, table.tableName);
      setExistingRecords(result.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};
    
    table.columns.forEach((column) => {
      if (column.required && !formData[column.name]) {
        newErrors[column.name] = 'This field is required';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await apiService.saveData(domainName, table.tableName, formData);
      onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const renderField = (column: ColumnConfig) => {
    switch (column.type) {
      case 'textarea':
        return (
          <textarea
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            value={formData[column.name] || ''}
            onChange={(e) => setFormData({ ...formData, [column.name]: e.target.value })}
            rows={3}
          />
        );
      case 'dropdown':
        return (
          <select
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            value={formData[column.name] || ''}
            onChange={(e) => setFormData({ ...formData, [column.name]: e.target.value })}
          >
            <option value="">Select...</option>
            {column.options?.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      case 'date':
        return (
          <input
            type="date"
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            value={formData[column.name] || ''}
            onChange={(e) => setFormData({ ...formData, [column.name]: e.target.value })}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            value={formData[column.name] || ''}
            onChange={(e) => setFormData({ ...formData, [column.name]: e.target.value })}
          />
        );
      default:
        return (
          <input
            type="text"
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            value={formData[column.name] || ''}
            onChange={(e) => setFormData({ ...formData, [column.name]: e.target.value })}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{table.displayName}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {/* Tabs for New/Existing */}
          {!table.relationships && (
            <div className="mb-6">
              <div className="border-b">
                <div className="flex space-x-8">
                  <button
                    className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'new'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setActiveTab('new')}
                  >
                    New Record
                  </button>
                  <button
                    className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'existing'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setActiveTab('existing')}
                  >
                    Existing Records ({existingRecords.length})
                  </button>
                </div>
              </div>

              {activeTab === 'existing' && (
                <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                  {existingRecords.map((record, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setFormData(record);
                        setActiveTab('new');
                      }}
                      className="w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="font-medium">
                        {table.businessKeys.map((key) => record[key]).join(' - ')}
                      </div>
                      <div className="text-sm text-gray-500">
                        Created: 
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Parent Link Info */}
          {table.relationships && parentData && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center text-blue-700">
                <Link2 className="w-5 h-5 mr-2" />
                <span className="font-medium">Linked to {table.relationships.parentTable}</span>
              </div>
              <div className="mt-2 text-sm">
                {table.relationships.parentKeys.map((key, idx) => (
                  <span key={key}>
                    {key}: <strong>{parentData[key]}</strong>
                    {idx < table.relationships!.parentKeys.length - 1 && ', '}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Form Fields */}
          {activeTab === 'new' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {table.columns.map((column) => (
                  <div key={column.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {column.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      {column.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {renderField(column)}
                    {errors[column.name] && (
                      <p className="mt-1 text-sm text-red-600">{errors[column.name]}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface CardBasedDataEntryProps {
  domain: DomainConfig;
}

const CardBasedDataEntry: React.FC<CardBasedDataEntryProps> = ({ domain }) => {
  const [activeTable, setActiveTable] = useState<TableConfig | null>(null);
  const [completedTables, setCompletedTables] = useState<TableConfig[]>([]);
  const [savedData, setSavedData] = useState<Record<string, DataRecord>>({});
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [viewConfig, setViewConfig] = useState<FrontendViewConfig | null>(null);

  useEffect(() => {
    loadViewConfig();
  }, [domain]);

  const loadViewConfig = async () => {
    try {
      const config = await apiService.getFrontendConfig();
      const view = config.views.find(v => v.domainName === domain.domainName);
      setViewConfig(view || null);
    } catch (error) {
      console.error('Error loading view config:', error);
    }
  };

  const handleFilterChange = (filterName: string, value: any) => {
    setFilters({ ...filters, [filterName]: value });
  };

  const applyFilters = () => {
    if (!viewConfig) return;
    
    const allRequiredFilters = viewConfig.filters?.filter(f => f.required) || [];
    const missingFilters = allRequiredFilters.filter(f => !filters[f.name]);
    
    if (missingFilters.length > 0) {
      alert(`Please select all required filters: ${missingFilters.map(f => f.displayName).join(', ')}`);
      return;
    }
    
    setFiltersApplied(true);
  };

  const resetFilters = () => {
    setFilters({});
    setFiltersApplied(false);
    setActiveTable(null);
    setCompletedTables([]);
    setSavedData({});
  };

  const handleTableClick = (table: TableConfig) => {
    // Check if dependencies are met
    if (table.relationships) {
      const parentCompleted = completedTables.some(
        t => t.tableName === table.relationships!.parentTable
      );
      if (!parentCompleted) {
        alert(`Please complete ${table.relationships.parentTable} first`);
        return;
      }
    }
    setActiveTable(table);
    setShowModal(true);
  };

  const handleSave = (data: DataRecord) => {
    if (!activeTable) return;
    
    // Add filter values to the saved data
    const dataWithFilters = { ...data, ...filters };
    
    setSavedData({
      ...savedData,
      [activeTable.tableName]: dataWithFilters,
    });
    
    if (!completedTables.find(t => t.tableName === activeTable.tableName)) {
      setCompletedTables([...completedTables, activeTable]);
    }
    
    setShowModal(false);
  };

  const getParentData = (table: TableConfig): DataRecord | null => {
    if (!table.relationships) return null;
    return savedData[table.relationships.parentTable] || null;
  };

  if (!filtersApplied && viewConfig && viewConfig.filters) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{domain.displayName}</h1>
            <p className="text-gray-600">Please select filters before entering data</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Required Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {viewConfig.filters.map((filter) => (
                <div key={filter.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {filter.displayName}
                    {filter.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {filter.type === 'dropdown' ? (
                    <select
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                      value={filters[filter.name] || ''}
                      onChange={(e) => handleFilterChange(filter.name, e.target.value)}
                    >
                      <option value="">{filter.placeholder || 'Select...'}</option>
                      {filter.options?.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder={filter.placeholder}
                      value={filters[filter.name] || ''}
                      onChange={(e) => handleFilterChange(filter.name, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6">
              <button
                onClick={applyFilters}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Apply Filters & Start Data Entry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{domain.displayName}</h1>
          <p className="text-gray-600">Visual hierarchy data entry with linked relationships</p>
          
          {/* Active Filters Display */}
          {filtersApplied && viewConfig && viewConfig.filters && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-blue-900">Active Filters: </span>
                  {viewConfig.filters.map((filter, idx) => (
                    <span key={filter.name} className="text-sm text-blue-700">
                      {filter.displayName}: <strong>{filters[filter.name]}</strong>
                      {idx < viewConfig.filters.length - 1 && ', '}
                    </span>
                  ))}
                </div>
                <button
                  onClick={resetFilters}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Change Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Progress Overview */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-700">Progress</h3>
              <p className="text-sm text-gray-500 mt-1">
                {completedTables.length} of {domain.tables.length} tables completed
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-48 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${(completedTables.length / domain.tables.length) * 100}%` }}
                />
              </div>
              <span className="text-sm text-gray-600">
                {Math.round((completedTables.length / domain.tables.length) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Table Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {domain.tables.map((table) => (
            <TableCard
              key={table.tableName}
              table={table}
              isActive={activeTable?.tableName === table.tableName}
              isCompleted={completedTables.some(t => t.tableName === table.tableName)}
              onClick={() => handleTableClick(table)}
              parentData={getParentData(table)}
            />
          ))}
        </div>

        {/* Data Entry Modal */}
        {showModal && activeTable && (
          <DataEntryModal
            table={activeTable}
            domainName={domain.domainName}
            parentData={getParentData(activeTable)}
            onClose={() => setShowModal(false)}
            onSave={handleSave}
          />
        )}
      </div>
    </div>
  );
};

// Main App Component
const App: React.FC = () => {
  const [backendConfig, setBackendConfig] = useState<BackendConfig | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<DomainConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [uiMode, setUiMode] = useState<UIMode>('sequential');

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const backend = await apiService.getBackendConfig();
      setBackendConfig(backend);
      setLoading(false);
    } catch (error) {
      console.error('Error loading configs:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading configuration...</p>
        </div>
      </div>
    );
  }

  if (!backendConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>Error loading configuration. Please check the backend server.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900"> Data Entry System</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">UI Mode:</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setUiMode('sequential')}
                  className={`px-3 py-1 rounded text-sm ${
                    uiMode === 'sequential'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Layout className="inline w-4 h-4 mr-1" />
                  Sequential
                </button>
                <button
                  onClick={() => setUiMode('cards')}
                  className={`px-3 py-1 rounded text-sm ${
                    uiMode === 'cards'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Grid3X3 className="inline w-4 h-4 mr-1" />
                  Cards
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Left Sidebar */}
        <aside className="w-64 bg-white shadow-md h-screen sticky top-0">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
              Navigation
            </h2>
            
            {/* Home Link */}
            <button
              onClick={() => setSelectedDomain(null)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors mb-4 ${
                !selectedDomain
                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Home className="inline w-4 h-4 mr-2" />
              Home
            </button>

            {/* Domains */}
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Domains
            </h3>
            <nav className="space-y-2">
              {backendConfig.domains.map((domain) => (
                <button
                  key={domain.domainName}
                  onClick={() => setSelectedDomain(domain)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    selectedDomain?.domainName === domain.domainName
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium">{domain.displayName}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {domain.tables.length} table{domain.tables.length !== 1 ? 's' : ''}: {domain.tables.map(t => t.displayName).slice(0, 2).join(', ')}{domain.tables.length > 2 && '...'}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {selectedDomain ? (
            uiMode === 'sequential' ? (
              <SequentialDataEntry domain={selectedDomain} />
            ) : (
              <CardBasedDataEntry domain={selectedDomain} />
            )
          ) : (
            <div className="h-full p-8">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Welcome to  Data Entry System
                </h2>
                
                {/* System Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600">{backendConfig.domains.length}</div>
                    <div className="text-sm text-gray-600">Domains</div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {backendConfig.domains.reduce((acc, d) => acc + d.tables.length, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Total Tables</div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {backendConfig.domains.reduce((acc, d) => 
                        acc + d.tables.reduce((tacc, t) => tacc + t.columns.length, 0), 0
                      )}
                    </div>
                    <div className="text-sm text-gray-600">Total Fields</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold mb-2">Sequential Form UI</h3>
                    <p className="text-gray-600 mb-4">
                      Step-by-step guided data entry with progress tracking. Best for users who need structured, linear workflow.
                    </p>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• Progressive data entry flow</li>
                      <li>• Visual progress indicators</li>
                      <li>• Automatic parent-child linking</li>
                      <li>• Clear completion tracking</li>
                    </ul>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold mb-2">Card-Based UI</h3>
                    <p className="text-gray-600 mb-4">
                      Visual hierarchy with flexible navigation. Best for users who need overview and non-linear access.
                    </p>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• All tables visible at once</li>
                      <li>• Visual relationship indicators</li>
                      <li>• Modal-based data entry</li>
                      <li>• Flexible navigation between tables</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Getting Started
                  </h3>
                  <p className="text-blue-800">
                    1. Select a domain from the left sidebar<br />
                    2. Choose your preferred UI mode using the toggle in the header<br />
                    3. Select required filters for your domain<br />
                    4. Begin entering data following the table relationships<br />
                    5. Track your progress as you complete each table
                  </p>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg shadow-sm border p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Available Domains</h4>
                    {backendConfig.domains.map((domain) => (
                      <div key={domain.domainName} className="py-2 border-b last:border-0">
                        <div className="font-medium">{domain.displayName}</div>
                        <div className="text-sm text-gray-500">
                          {domain.tables.map(t => t.displayName).join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Available Tables</h4>
                    <div className="space-y-3">
                      {backendConfig.domains.map((domain) => (
                        <div key={domain.domainName}>
                          <h5 className="font-medium text-gray-800 text-sm">{domain.displayName}</h5>
                          <ul className="text-sm text-gray-600 space-y-1 ml-4 mt-1">
                            {domain.tables.map((table) => (
                              <li key={table.tableName}>• {table.displayName}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;


//main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional, Union
from datetime import datetime, timedelta
import json
import random

app = FastAPI(title="CMC Data Entry API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class ColumnConfig(BaseModel):
    name: str
    type: str  # text, number, date, dropdown, etc.
    required: bool = False
    options: Optional[List[str]] = None  # For dropdowns
    validation: Optional[Dict[str, Any]] = None

class RelationshipConfig(BaseModel):
    type: str  # "one" or "many"
    parentTable: str
    parentKeys: List[str]
    childKeys: List[str]

class TableConfig(BaseModel):
    tableName: str
    displayName: str
    businessKeys: List[str]
    columns: List[ColumnConfig]
    relationships: Optional[RelationshipConfig] = None

class DomainConfig(BaseModel):
    domainName: str
    displayName: str
    tables: List[TableConfig]

class ViewColumnConfig(BaseModel):
    columnName: str
    displayName: str
    width: Optional[str] = None
    editable: bool = True

class FilterConfig(BaseModel):
    name: str
    displayName: str
    type: str  # dropdown, text, date
    required: bool = True
    options: Optional[List[str]] = None  # For dropdowns
    placeholder: Optional[str] = None

class FrontendViewConfig(BaseModel):
    viewName: str
    domainName: str
    filters: List[FilterConfig]  # Add filters configuration
    displayColumns: Dict[str, List[ViewColumnConfig]]  # tableName -> columns

# Backend Configuration
BACKEND_CONFIG = {
    "domains": [
       
    ]
}

# Frontend Configuration
FRONTEND_CONFIG = {
    "views": [
        
    ]
}

# Initialize with test data
DATA_STORE = {
    
    
}

# API Endpoints
@app.get("/")
def read_root():
    return {"message": "CMC Data Entry API", "version": "1.0.0"}

@app.get("/api/config/backend")
def get_backend_config():
    return BACKEND_CONFIG

@app.get("/api/config/frontend")
def get_frontend_config():
    return FRONTEND_CONFIG

@app.get("/api/config/domain/{domain_name}")
def get_domain_config(domain_name: str):
    for domain in BACKEND_CONFIG["domains"]:
        if domain["domainName"] == domain_name:
            return domain
    raise HTTPException(status_code=404, detail="Domain not found")

@app.get("/api/config/view/{view_name}")
def get_view_config(view_name: str):
    for view in FRONTEND_CONFIG["views"]:
        if view["viewName"] == view_name:
            return view
    raise HTTPException(status_code=404, detail="View not found")

@app.post("/api/data/{domain_name}/{table_name}")
def save_data(domain_name: str, table_name: str, data: Dict[str, Any]):
    key = f"{domain_name}.{table_name}"
    if key not in DATA_STORE:
        DATA_STORE[key] = []
    
    # Add timestamp
    data["created_at"] = datetime.now().isoformat()
    data["updated_at"] = datetime.now().isoformat()
    
    DATA_STORE[key].append(data)
    return {"success": True, "data": data}

@app.get("/api/data/{domain_name}/{table_name}")
def get_data(domain_name: str, table_name: str):
    key = f"{domain_name}.{table_name}"
    return {"data": DATA_STORE.get(key, [])}

@app.put("/api/data/{domain_name}/{table_name}")
def update_data(domain_name: str, table_name: str, data: Dict[str, Any]):
    key = f"{domain_name}.{table_name}"
    if key not in DATA_STORE:
        raise HTTPException(status_code=404, detail="No data found")
    
    # Find and update based on business keys
    # This is simplified - in production, use proper database with unique constraints
    data["updated_at"] = datetime.now().isoformat()
    
    return {"success": True, "data": data}

@app.get("/api/data/{domain_name}/{table_name}/search")
def search_data(domain_name: str, table_name: str, q: str):
    key = f"{domain_name}.{table_name}"
    data = DATA_STORE.get(key, [])
    
    # Simple search implementation
    results = []
    for item in data:
        for value in item.values():
            if q.lower() in str(value).lower():
                results.append(item)
                break
    
    return {"data": results}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

                    
