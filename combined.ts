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
  primaryKeyColumn?: string;
}

interface DomainConfig {
  domainName: string;
  displayName: string;
  tables: TableConfig[];
  insertionOrder: string[];
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

interface PrimaryKeyRef {
  tableName: string;
  primaryKeyValue: any;
}

interface DataRecord {
  [key: string]: any;
  created_at?: string;
  updated_at?: string;
  _pk?: PrimaryKeyRef;  // Primary key reference from backend
  _tempId?: string;     // Temporary ID for frontend tracking
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
  getData: async (domainName: string, tableName: string, parentKeys?: Record<string, string>): Promise<{ data: DataRecord[] }> => {
    let url = `${API_BASE}/data/${domainName}/${tableName}`;
    
    // Add parent key filters as query parameters
    if (parentKeys && Object.keys(parentKeys).length > 0) {
      const params = Object.entries(parentKeys)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join(',');
      url += `?parent_keys=${encodeURIComponent(params)}`;
    }
    
    const response = await fetch(url);
    return response.json();
  },
  // This is now just for loading existing data, not for saving during data entry
  saveData: async (domainName: string, tableName: string, data: DataRecord): Promise<{ success: boolean; data: DataRecord }> => {
    const response = await fetch(`${API_BASE}/data/${domainName}/${tableName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  // New writeback method for final save
  writebackDomain: async (domainName: string, data: Record<string, DataRecord[]>): Promise<{ success: boolean }> => {
    const response = await fetch(`${API_BASE}/writeback/${domainName}`, {
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

interface DataBrowserProps {
  records: DataRecord[];
  businessKeys: string[];
  columns: ColumnConfig[];
  onSelectRecord: (record: DataRecord) => void;
  onClose: () => void;
}

const DataBrowser: React.FC<DataBrowserProps> = ({ 
  records, 
  businessKeys, 
  columns,
  onSelectRecord,
  onClose 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterColumn, setFilterColumn] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');

  // Filter and sort records
  const processedRecords = React.useMemo(() => {
    let filtered = [...records];

    // Apply search filter - exclude id and foreign key fields from search
    if (searchTerm) {
      filtered = filtered.filter(record => 
        Object.entries(record).some(([key, value]) => {
          // Skip technical fields in search
          if (['id', 'parent_step_id', 'substep_id', 'step_id', 'batch_lot_id', '_pk', '_tempId'].includes(key)) {
            return false;
          }
          return String(value).toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Apply column filter
    if (filterColumn && filterValue) {
      filtered = filtered.filter(record => 
        String(record[filterColumn]).toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    // Apply sorting
    if (sortField) {
      filtered.sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        const comparison = String(aVal).localeCompare(String(bVal));
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [records, searchTerm, sortField, sortDirection, filterColumn, filterValue]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const displayColumns = columns.filter(col => 
    businessKeys.includes(col.name) || 
    ['created_at', 'updated_at'].includes(col.name) ||
    (columns.indexOf(col) < 6 && 
     // Exclude technical columns from display
     !['id', 'parent_step_id', 'substep_id', 'step_id', 'batch_lot_id', '_pk', '_tempId'].includes(col.name))
  );

  return (
    <div className="bg-white rounded-lg shadow-lg max-h-96 overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Browse Existing Records ({records.length} total)
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-wrap gap-2">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search all fields..."
                className="w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <select
            className="px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500"
            value={filterColumn}
            onChange={(e) => setFilterColumn(e.target.value)}
          >
            <option value="">Filter by column...</option>
            {columns
              .filter(col => 
                // Exclude technical columns from filter options
                !['id', 'parent_step_id', 'substep_id', 'step_id', 'batch_lot_id', '_pk', '_tempId'].includes(col.name)
              )
              .map(col => (
                <option key={col.name} value={col.name}>
                  {col.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
          </select>

          {filterColumn && (
            <input
              type="text"
              placeholder="Filter value..."
              className="px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
            />
          )}

          {(searchTerm || filterColumn) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterColumn('');
                setFilterValue('');
              }}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Records Table */}
      <div className="flex-1 overflow-auto">
        {processedRecords.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No records found matching your criteria
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-700">
                  Actions
                </th>
                {displayColumns.map(col => (
                  <th
                    key={col.name}
                    className="px-4 py-2 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort(col.name)}
                  >
                    <div className="flex items-center">
                      {col.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      {sortField === col.name && (
                        <ChevronRight 
                          className={`w-4 h-4 ml-1 transform ${
                            sortDirection === 'desc' ? 'rotate-90' : '-rotate-90'
                          }`}
                        />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {processedRecords.map((record, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <button
                      onClick={() => onSelectRecord(record)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Select
                    </button>
                  </td>
                  {displayColumns.map(col => (
                    <td key={col.name} className="px-4 py-2">
                      {col.name.includes('date') || col.name.includes('_at')
                        ? record[col.name] ? new Date(record[col.name]).toLocaleDateString() : '-'
                        : record[col.name] || '-'
                      }
                      {businessKeys.includes(col.name) && (
                        <span className="ml-1 text-xs text-blue-600">●</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer with count */}
      <div className="px-4 py-2 border-t bg-gray-50 text-sm text-gray-600">
        Showing {processedRecords.length} of {records.length} records
        {businessKeys.length > 0 && (
          <span className="ml-4">
            <span className="text-blue-600">●</span> = Business Key
          </span>
        )}
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
  const [showDataBrowser, setShowDataBrowser] = useState(false);
  const [showOnlyLinked, setShowOnlyLinked] = useState(true);

  useEffect(() => {
    loadExistingData();
    resetForm();
  }, [table, parentData, showOnlyLinked]);

  const resetForm = () => {
    if (table.relationships && parentData) {
      const linkedData: DataRecord = {};
      table.relationships.childKeys.forEach((key, index) => {
        linkedData[key] = parentData[table.relationships!.parentKeys[index]];
      });
      setFormData(linkedData);
    } else {
      setFormData({});
    }
    setSelectedRecord(null);
    setIsNewRecord(true);
    setShowDataBrowser(false);
    setErrors({});
  };

  const loadExistingData = async () => {
    try {
      // If this is a child table, only load records related to parent
      let parentKeys: Record<string, string> | undefined;
      
      if (table.relationships && parentData && showOnlyLinked) {
        parentKeys = {};
        table.relationships.childKeys.forEach((childKey, index) => {
          const parentKey = table.relationships!.parentKeys[index];
          parentKeys![childKey] = parentData[parentKey];
        });
      }
      
      const result = await apiService.getData(domainName, table.tableName, parentKeys);
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

    // Prepare data to save
    const dataToSave = { ...formData };
    
    // If updating existing record, preserve its primary key reference
    if (!isNewRecord && selectedRecord?._pk) {
      dataToSave._pk = selectedRecord._pk;
    } else if (isNewRecord && !dataToSave._tempId) {
      // Generate temporary ID for new records
      dataToSave._tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    
    // Don't save to database - just pass data to parent
    onSave(dataToSave);
    
    // For many relationships, reset form for next entry
    if (table.relationships?.type === 'many') {
      resetForm();
      // Note: We don't reload existing data as we're working locally
    } else {
      // For one relationships, clear completely
      setFormData({});
      setSelectedRecord(null);
      setIsNewRecord(true);
    }
  };

  const handleSelectExisting = (record: DataRecord) => {
    // For child tables, verify the selected record is linked to parent
    if (table.relationships && parentData) {
      const isLinked = table.relationships.childKeys.every((childKey, index) => {
        const parentKey = table.relationships!.parentKeys[index];
        return record[childKey] === parentData[parentKey];
      });
      
      if (!isLinked && showOnlyLinked) {
        alert('This record is not linked to the selected parent. Toggle "Show only linked records" to select it.');
        return;
      }
    }
    
    setSelectedRecord(record);
    // Clean the record data for form (remove technical fields)
    const cleanedData = { ...record };
    delete cleanedData._pk;
    delete cleanedData._tempId;
    setFormData(cleanedData);
    setIsNewRecord(false);
    setShowDataBrowser(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{table.displayName}</h3>
        {table.relationships?.type === 'many' && (
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
            One-to-Many Relationship
          </span>
        )}
      </div>
      
      {/* Parent Relationship Info */}
      {table.relationships && parentData && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <Link2 className="inline w-4 h-4 mr-1" />
            Linked to: {table.relationships.parentKeys.map((key) => parentData[key]).join(' - ')}
          </p>
        </div>
      )}

      {/* Record Selection */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700">
            Record Selection
          </h4>
          <div className="flex items-center gap-4">
            {table.relationships && (
              <label className="flex items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={showOnlyLinked}
                  onChange={(e) => setShowOnlyLinked(e.target.checked)}
                  className="mr-2"
                />
                Show only linked records
              </label>
            )}
            {existingRecords.length > 0 && (
              <span className="text-sm text-gray-500">
                {existingRecords.length} {showOnlyLinked && table.relationships ? 'linked' : 'total'} records
              </span>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => {
              setIsNewRecord(true);
              setFormData(table.relationships && parentData ? 
                Object.fromEntries(
                  table.relationships.childKeys.map((key, index) => 
                    [key, parentData[table.relationships!.parentKeys[index]]]
                  )
                ) : {}
              );
              setSelectedRecord(null);
              setShowDataBrowser(false);
            }}
            className={`flex-1 px-4 py-2 rounded-md border ${
              isNewRecord
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-white hover:bg-gray-50 text-gray-700'
            }`}
          >
            <Plus className="inline w-4 h-4 mr-2" />
            Create New Record
          </button>
          
          <button
            onClick={() => setShowDataBrowser(!showDataBrowser)}
            className={`flex-1 px-4 py-2 rounded-md border ${
              !isNewRecord && selectedRecord
                ? 'bg-green-50 border-green-300 text-green-700'
                : 'bg-white hover:bg-gray-50 text-gray-700'
            }`}
          >
            <Database className="inline w-4 h-4 mr-2" />
            {selectedRecord ? 'Change Selection' : 'Browse Existing'}
            {selectedRecord && (
              <span className="ml-2 text-sm">
                ({table.businessKeys.map(key => selectedRecord[key]).join(' - ')})
              </span>
            )}
          </button>
        </div>

        {/* Data Browser */}
        {showDataBrowser && (
          <div className="mt-4">
            <DataBrowser
              records={existingRecords}
              businessKeys={table.businessKeys}
              columns={table.columns}
              onSelectRecord={handleSelectExisting}
              onClose={() => setShowDataBrowser(false)}
            />
          </div>
        )}
      </div>

      {/* Current Selection Info */}
      {!isNewRecord && selectedRecord && !showDataBrowser && (
        <div className="mb-4 p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-700">
            <Edit2 className="inline w-4 h-4 mr-1" />
            Editing existing record: {table.businessKeys.map(key => selectedRecord[key]).join(' - ')}
          </p>
        </div>
      )}

      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {table.columns
            .filter(column => 
              // Exclude technical columns from form
              !['id', 'parent_step_id', 'substep_id', 'step_id', 'batch_lot_id', '_pk', '_tempId'].includes(column.name)
            )
            .map((column) => (
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
            {isNewRecord ? 
              (table.relationships?.type === 'many' ? 'Save Draft & Add Another' : 'Save Draft & Continue') : 
              'Update Draft & Continue'
            }
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
  const [savedData, setSavedData] = useState<Record<string, DataRecord | DataRecord[]>>({});
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

  const handleSave = (data: DataRecord, continueToNext: boolean = true) => {
    const currentTable = domain.tables[currentStep];
    // Add filter values to the saved data
    const dataWithFilters = { ...data, ...filters };
    
    // Check if this is a many relationship
    if (currentTable.relationships?.type === 'many') {
      // For many relationships, append to an array
      const existingData = savedData[currentTable.tableName] as DataRecord[] || [];
      setSavedData({
        ...savedData,
        [currentTable.tableName]: [...existingData, dataWithFilters],
      });
    } else {
      // For one relationship or root tables, save as single record
      setSavedData({
        ...savedData,
        [currentTable.tableName]: dataWithFilters,
      });
    }
    
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    
    // Only move to next step if requested and not a many relationship
    if (continueToNext && currentStep < domain.tables.length - 1) {
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
  const parentData: DataRecord | null = parentTable ? (() => {
    const data = savedData[parentTable];
    if (Array.isArray(data)) {
      return data[0] || null;
    }
    return data as DataRecord || null;
  })() : null;

  // Get child records for the current parent
  const getChildRecordsForParent = (): DataRecord[] => {
    if (!currentTable.relationships || !parentData) return [];
    
    const allRecords = savedData[currentTable.tableName];
    if (!allRecords) return [];
    
    const recordsArray = Array.isArray(allRecords) ? allRecords : [allRecords];
    
    return recordsArray.filter((record): record is DataRecord => {
      if (!record || typeof record !== 'object') return false;
      return currentTable.relationships!.childKeys.every((childKey, index) => {
        const parentKey = currentTable.relationships!.parentKeys[index];
        return record[childKey] === parentData![parentKey];
      });
    });
  };

  const childRecordsForParent = getChildRecordsForParent();

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
          
          {/* Draft Mode Indicator */}
          <div className="mt-2 inline-flex items-center px-3 py-1 bg-amber-100 text-amber-800 rounded-md text-sm">
            <span className="mr-2">📝</span>
            Draft Mode - All changes are saved locally until final submission
          </div>
          
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
            {/* Show existing child records for many relationships */}
            {currentTable.relationships?.type === 'many' && childRecordsForParent.length > 0 && (
              <div className="mb-4 bg-white rounded-lg shadow-sm border p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Existing {currentTable.displayName} for this parent
                </h4>
                <div className="space-y-2">
                  {childRecordsForParent.map((record, idx) => (
                    <div key={idx} className="p-2 bg-gray-50 rounded border border-gray-200">
                      <div className="text-sm">
                        {currentTable.businessKeys.map(key => (
                          <span key={key} className="font-medium">
                            {key}: {record[key]}{' '}
                          </span>
                        ))}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {currentTable.columns.slice(0, 3).map(col => (
                          <span key={col.name}>
                            {col.name}: {record[col.name] || '-'}{' '}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  You can add more records or continue to the next step.
                </p>
              </div>
            )}

            <DataEntryForm
              table={currentTable}
              domainName={domain.domainName}
              parentData={parentData}
              onSave={(data) => {
                // For many relationships, don't auto-advance
                const autoAdvance = currentTable.relationships?.type !== 'many';
                handleSave(data, autoAdvance);
              }}
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
              
              <div className="flex gap-2">
                {currentTable.relationships?.type === 'many' && (
                  <button
                    onClick={() => {
                      // Force reload the form for adding another record
                      setCurrentStep(currentStep);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <Plus className="inline w-4 h-4 mr-1" />
                    Add Another {currentTable.displayName}
                  </button>
                )}
                
                {currentStep < domain.tables.length - 1 ? (
                  <button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    disabled={!completedSteps.includes(currentStep)}
                    className={`px-4 py-2 rounded-md ${
                      !completedSteps.includes(currentStep)
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    Continue to Next Step
                    <ChevronRight className="inline w-4 h-4 ml-1" />
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                      onClick={() => console.log('Draft data:', savedData)}
                    >
                      View Draft Data
                    </button>
                    <button
                      className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      onClick={async () => {
                        // Convert saved data to format expected by writeback
                        const writebackData: Record<string, DataRecord[]> = {};
                        Object.entries(savedData).forEach(([tableName, data]) => {
                          writebackData[tableName] = Array.isArray(data) ? data : [data];
                        });
                        
                        console.log('Writeback data:', writebackData);
                        console.log('Insertion order:', domain.insertionOrder);
                        alert('Writeback will be implemented in the next update. Check console for data structure.');
                        
                        // TODO: Call writeback API
                        // const result = await apiService.writebackDomain(domain.domainName, writebackData);
                      }}
                    >
                      Submit All Data
                    </button>
                  </div>
                )}
              </div>
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
  children?: React.ReactNode;
}

const TableCard: React.FC<TableCardProps> = ({ table, isActive, isCompleted, onClick, parentData, children }) => {
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
      
      {/* Additional content like record count */}
      {children}
    </div>
  );
};

interface DataEntryModalProps {
  table: TableConfig;
  domainName: string;
  parentData: DataRecord | null;
  onClose: () => void;
  onSave: (data: DataRecord) => void;
  savedRecords?: DataRecord[];
}

const DataEntryModal: React.FC<DataEntryModalProps> = ({ table, domainName, parentData, onClose, onSave, savedRecords = [] }) => {
  const [formData, setFormData] = useState<DataRecord>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'new' | 'existing'>('new');
  const [existingRecords, setExistingRecords] = useState<DataRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<DataRecord | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(true);
  const [showOnlyLinked, setShowOnlyLinked] = useState(true);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    loadExistingData();
    if (table.relationships && parentData) {
      const linkedData: DataRecord = {};
      table.relationships.childKeys.forEach((key, index) => {
        linkedData[key] = parentData[table.relationships!.parentKeys[index]];
      });
      setFormData(linkedData);
    }
  }, [table, parentData, showOnlyLinked]);

  const loadExistingData = async () => {
    try {
      // If this is a child table, only load records related to parent
      let parentKeys: Record<string, string> | undefined;
      
      if (table.relationships && parentData && showOnlyLinked) {
        parentKeys = {};
        table.relationships.childKeys.forEach((childKey, index) => {
          const parentKey = table.relationships!.parentKeys[index];
          parentKeys![childKey] = parentData[parentKey];
        });
      }
      
      const result = await apiService.getData(domainName, table.tableName, parentKeys);
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

    // Prepare data to save
    const dataToSave = { ...formData };
    
    // If updating existing record, preserve its primary key reference
    if (!isNewRecord && selectedRecord?._pk) {
      dataToSave._pk = selectedRecord._pk;
    } else if (isNewRecord && !dataToSave._tempId) {
      // Generate temporary ID for new records
      dataToSave._tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    
    // Don't save to database - just pass data to parent
    onSave(dataToSave);
    
    // For many relationships, show success and reset form
    if (table.relationships?.type === 'many') {
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      
      // Reset form with parent data
      const linkedData: DataRecord = {};
      table.relationships.childKeys.forEach((key, index) => {
        linkedData[key] = parentData![table.relationships!.parentKeys[index]];
      });
      setFormData(linkedData);
      setSelectedRecord(null);
      setIsNewRecord(true);
      // Note: We don't reload existing data as we're working locally
    } else {
      onClose();
    }
  };

  const handleSelectExisting = (record: DataRecord) => {
    // For child tables, verify the selected record is linked to parent
    if (table.relationships && parentData) {
      const isLinked = table.relationships.childKeys.every((childKey, index) => {
        const parentKey = table.relationships!.parentKeys[index];
        return record[childKey] === parentData[parentKey];
      });
      
      if (!isLinked && showOnlyLinked) {
        alert('This record is not linked to the selected parent. Toggle "Show all records" to select it.');
        return;
      }
    }
    
    setSelectedRecord(record);
    // Clean the record data for form (remove technical fields)
    const cleanedData = { ...record };
    delete cleanedData._pk;
    delete cleanedData._tempId;
    setFormData(cleanedData);
    setIsNewRecord(false);
    setActiveTab('new');
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
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold">{table.displayName}</h2>
            {table.relationships?.type === 'many' && (
              <span className="ml-3 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                One-to-Many
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {/* Success Message */}
          {showSuccessMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <Check className="inline w-4 h-4 mr-1" />
                Draft saved successfully! You can add another record or close this dialog.
              </p>
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

          {/* Show saved records for many relationships */}
          {table.relationships?.type === 'many' && savedRecords.length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Records added in this session ({savedRecords.length})
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {savedRecords.map((record, idx) => (
                  <div key={idx} className="p-2 bg-white rounded border border-gray-200">
                    <div className="text-sm">
                      {table.businessKeys.map(key => (
                        <span key={key} className="font-medium mr-3">
                          {key}: {record[key]}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabs for New/Existing */}
          <div className="mb-6">
            <div className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex space-x-8">
                  <button
                    className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'new'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => {
                      setActiveTab('new');
                      if (!selectedRecord) {
                        setIsNewRecord(true);
                        setFormData(table.relationships && parentData ? 
                          Object.fromEntries(
                            table.relationships.childKeys.map((key, index) => 
                              [key, parentData[table.relationships!.parentKeys[index]]]
                            )
                          ) : {}
                        );
                      }
                    }}
                  >
                    {isNewRecord ? 'New Record' : 'Edit Record'}
                  </button>
                  <button
                    className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'existing'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setActiveTab('existing')}
                  >
                    Browse Records ({existingRecords.length}{table.relationships && showOnlyLinked ? ' linked' : ' total'})
                  </button>
                </div>
                
                {table.relationships && activeTab === 'existing' && (
                  <label className="flex items-center text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={showOnlyLinked}
                      onChange={(e) => setShowOnlyLinked(e.target.checked)}
                      className="mr-2"
                    />
                    Show only linked records
                  </label>
                )}
              </div>
            </div>

            {activeTab === 'existing' && (
              <div className="mt-4">
                <DataBrowser
                  records={existingRecords}
                  businessKeys={table.businessKeys}
                  columns={table.columns}
                  onSelectRecord={handleSelectExisting}
                  onClose={() => setActiveTab('new')}
                />
              </div>
            )}
          </div>

          {/* Current Selection Info */}
          {!isNewRecord && selectedRecord && activeTab === 'new' && (
            <div className="mb-4 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">
                <Edit2 className="inline w-4 h-4 mr-1" />
                Editing: {table.businessKeys.map(key => selectedRecord[key]).join(' - ')}
                <button
                  onClick={() => {
                    setIsNewRecord(true);
                    setFormData(table.relationships && parentData ? 
                      Object.fromEntries(
                        table.relationships.childKeys.map((key, index) => 
                          [key, parentData[table.relationships!.parentKeys[index]]]
                        )
                      ) : {}
                    );
                    setSelectedRecord(null);
                  }}
                  className="ml-4 text-blue-600 hover:text-blue-800"
                >
                  Create New Instead
                </button>
              </p>
            </div>
          )}

          {/* Form Fields */}
          {activeTab === 'new' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {table.columns
                  .filter(column => 
                    // Exclude technical columns from form
                    !['id', 'parent_step_id', 'substep_id', 'step_id', 'batch_lot_id', '_pk', '_tempId'].includes(column.name)
                  )
                  .map((column) => (
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
                {table.relationships?.type === 'many' && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Done Adding Records
                  </button>
                )}
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
                  {isNewRecord ? 
                    (table.relationships?.type === 'many' ? 'Save Draft & Add Another' : 'Save Draft') : 
                    'Update Draft'
                  }
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
  const [savedData, setSavedData] = useState<Record<string, DataRecord | DataRecord[]>>({});
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
    
    // Check if this is a many relationship
    if (activeTable.relationships?.type === 'many') {
      // For many relationships, append to an array
      const existingData = savedData[activeTable.tableName] as DataRecord[] || [];
      setSavedData({
        ...savedData,
        [activeTable.tableName]: [...existingData, dataWithFilters],
      });
    } else {
      // For one relationship or root tables, save as single record
      setSavedData({
        ...savedData,
        [activeTable.tableName]: dataWithFilters,
      });
    }
    
    if (!completedTables.find(t => t.tableName === activeTable.tableName)) {
      setCompletedTables([...completedTables, activeTable]);
    }
    
    // For many relationships, keep modal open for adding more
    if (activeTable.relationships?.type !== 'many') {
      setShowModal(false);
    }
  };

  const getParentData = (table: TableConfig): DataRecord | null => {
    if (!table.relationships) return null;
    const parentData = savedData[table.relationships.parentTable];
    if (!parentData) return null;
    return Array.isArray(parentData) ? parentData[0] : parentData as DataRecord;
  };

  // Get record count for a table
  const getRecordCount = (tableName: string): number => {
    const data = savedData[tableName];
    if (!data) return 0;
    return Array.isArray(data) ? data.length : 1;
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
          
          {/* Draft Mode Indicator */}
          <div className="mt-2 inline-flex items-center px-3 py-1 bg-amber-100 text-amber-800 rounded-md text-sm">
            <span className="mr-2">📝</span>
            Draft Mode - All changes are saved locally until final submission
          </div>
          
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
          
          {/* Final Save Button */}
          {completedTables.length === domain.tables.length && domain.tables.length > 0 && (
            <div className="mt-4 pt-4 border-t flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                onClick={() => console.log('Draft data:', savedData)}
              >
                View Draft Data
              </button>
              <button
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                onClick={async () => {
                  // Convert saved data to format expected by writeback
                  const writebackData: Record<string, DataRecord[]> = {};
                  Object.entries(savedData).forEach(([tableName, data]) => {
                    writebackData[tableName] = Array.isArray(data) ? data : [data];
                  });
                  
                  console.log('Writeback data:', writebackData);
                  console.log('Insertion order:', domain.insertionOrder);
                  alert('Writeback will be implemented in the next update. Check console for data structure.');
                  
                  // TODO: Call writeback API
                  // const result = await apiService.writebackDomain(domain.domainName, writebackData);
                }}
              >
                Submit All Data
              </button>
            </div>
          )}
        </div>

        {/* Table Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {domain.tables.map((table) => {
            const recordCount = getRecordCount(table.tableName);
            const isCompleted = completedTables.some(t => t.tableName === table.tableName);
            
            return (
              <TableCard
                key={table.tableName}
                table={table}
                isActive={activeTable?.tableName === table.tableName}
                isCompleted={isCompleted}
                onClick={() => handleTableClick(table)}
                parentData={getParentData(table)}
              >
                {/* Show record count for many relationships */}
                {isCompleted && table.relationships?.type === 'many' && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {recordCount} record{recordCount !== 1 ? 's' : ''} added
                      </span>
                      <span className="text-blue-600 font-medium">
                        Add more →
                      </span>
                    </div>
                  </div>
                )}
              </TableCard>
            );
          })}
        </div>

        {/* Data Entry Modal */}
        {showModal && activeTable && (
          <DataEntryModal
            table={activeTable}
            domainName={domain.domainName}
            parentData={getParentData(activeTable)}
            onClose={() => setShowModal(false)}
            onSave={handleSave}
            savedRecords={
              activeTable.relationships?.type === 'many' 
                ? (Array.isArray(savedData[activeTable.tableName]) 
                    ? (savedData[activeTable.tableName] as DataRecord[]).filter(record => {
                        // Filter records for current parent
                        return activeTable.relationships!.childKeys.every((childKey, index) => {
                          const parentKey = activeTable.relationships!.parentKeys[index];
                          const parent = getParentData(activeTable);
                          return parent && record[childKey] === parent[parentKey];
                        });
                      })
                    : [])
                : []
            }
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
            <h1 className="text-xl font-bold text-gray-900">CMC Data Entry System</h1>
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
                  Welcome to CMC Data Entry System
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

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
import json

# SQLAlchemy setup
DATABASE_URL = "sqlite:///./cmc_data.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Pydantic models for API
class ColumnConfig(BaseModel):
    name: str
    type: str
    required: bool = True
    options: Optional[List[str]] = None
    validation: Optional[Dict[str, Any]] = None

class RelationshipConfig(BaseModel):
    type: str  # 'one' or 'many'
    parentTable: str
    parentKeys: List[str]
    childKeys: List[str]

class TableConfig(BaseModel):
    tableName: str
    displayName: str
    businessKeys: List[str]
    columns: List[ColumnConfig]
    relationships: Optional[RelationshipConfig] = None
    primaryKeyColumn: str = "id"  # Configurable primary key column name

class DomainConfig(BaseModel):
    domainName: str
    displayName: str
    tables: List[TableConfig]
    insertionOrder: List[str]  # Table names in order they should be inserted

class BackendConfig(BaseModel):
    domains: List[DomainConfig]

class ViewColumnConfig(BaseModel):
    columnName: str
    displayName: str
    width: Optional[str] = None
    editable: Optional[bool] = True

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

class FrontendConfig(BaseModel):
    views: List[FrontendViewConfig]

class DataRecord(BaseModel):
    class Config:
        extra = 'allow'

# Primary Key Response Model
class PrimaryKeyRef(BaseModel):
    tableName: str
    primaryKeyValue: Any

# SQLAlchemy Models (same as before)
# Manufacturing Process Models
class ManufacturingStep(Base):
    __tablename__ = 'manufacturing_steps'
    
    id = Column(Integer, primary_key=True, index=True)
    step_code = Column(String, nullable=False)
    step_name = Column(String, nullable=False)
    step_type = Column(String)
    description = Column(Text)
    sequence_number = Column(Integer)
    duration_hours = Column(Float)
    temperature_range = Column(String)
    pressure_range = Column(String)
    critical_quality_attributes = Column(Text)
    safety_level = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    substeps = relationship("ManufacturingSubstep", back_populates="parent_step")
    in_process_controls = relationship("InProcessControl", back_populates="step")
    step_category = relationship("StepCategory", uselist=False, back_populates="step")

class ManufacturingSubstep(Base):
    __tablename__ = 'manufacturing_substeps'
    
    id = Column(Integer, primary_key=True, index=True)
    substep_code = Column(String, nullable=False)
    substep_name = Column(String, nullable=False)
    substep_type = Column(String)
    description = Column(Text)
    sequence_number = Column(Integer)
    duration_minutes = Column(Integer)
    operator_count = Column(Integer)
    skill_level_required = Column(String)
    equipment_required = Column(Text)
    safety_notes = Column(Text)
    parent_step_code = Column(String)
    parent_step_name = Column(String)
    parent_step_id = Column(Integer, ForeignKey('manufacturing_steps.id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    parent_step = relationship("ManufacturingStep", back_populates="substeps")
    process_parameters = relationship("ProcessParameter", back_populates="substep")
    equipment_setups = relationship("EquipmentSetup", back_populates="substep")

class ProcessParameter(Base):
    __tablename__ = 'process_parameters'
    
    id = Column(Integer, primary_key=True, index=True)
    parameter_code = Column(String, nullable=False)
    parameter_name = Column(String, nullable=False)
    parameter_type = Column(String)
    nominal_value = Column(String)
    lower_limit = Column(String)
    upper_limit = Column(String)
    unit_of_measure = Column(String)
    criticality = Column(String)
    monitoring_frequency = Column(String)
    control_strategy = Column(Text)
    deviation_procedure = Column(Text)
    substep_code = Column(String)
    substep_name = Column(String)
    step_code = Column(String)
    step_name = Column(String)
    substep_id = Column(Integer, ForeignKey('manufacturing_substeps.id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    substep = relationship("ManufacturingSubstep", back_populates="process_parameters")

class EquipmentSetup(Base):
    __tablename__ = 'equipment_setup'
    
    id = Column(Integer, primary_key=True, index=True)
    setup_id = Column(String, nullable=False)
    equipment_id = Column(String, nullable=False)
    equipment_name = Column(String, nullable=False)
    equipment_type = Column(String)
    setup_parameters = Column(Text)
    cleaning_requirements = Column(String)
    calibration_status = Column(String)
    qualification_status = Column(String)
    substep_code = Column(String)
    substep_name = Column(String)
    substep_id = Column(Integer, ForeignKey('manufacturing_substeps.id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    substep = relationship("ManufacturingSubstep", back_populates="equipment_setups")

class InProcessControl(Base):
    __tablename__ = 'in_process_controls'
    
    id = Column(Integer, primary_key=True, index=True)
    control_id = Column(String, nullable=False)
    control_name = Column(String, nullable=False)
    control_type = Column(String)
    specification = Column(String)
    test_method = Column(String)
    sampling_point = Column(String)
    sampling_frequency = Column(String)
    acceptance_criteria = Column(Text)
    out_of_spec_procedure = Column(Text)
    step_code = Column(String)
    step_name = Column(String)
    step_id = Column(Integer, ForeignKey('manufacturing_steps.id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    step = relationship("ManufacturingStep", back_populates="in_process_controls")

class StepCategory(Base):
    __tablename__ = 'step_categories'
    
    id = Column(Integer, primary_key=True, index=True)
    category_code = Column(String, nullable=False)
    category_name = Column(String, nullable=False)
    category_type = Column(String)
    regulatory_requirements = Column(Text)
    validation_criteria = Column(Text)
    documentation_level = Column(String)
    step_code = Column(String)
    step_id = Column(Integer, ForeignKey('manufacturing_steps.id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    step = relationship("ManufacturingStep", back_populates="step_category")

# Batch Lot Models
class BatchLot(Base):
    __tablename__ = 'batch_lots'
    
    id = Column(Integer, primary_key=True, index=True)
    batch_number = Column(String, nullable=False)
    lot_number = Column(String, nullable=False)
    product_code = Column(String, nullable=False)
    product_name = Column(String, nullable=False)
    manufacture_date = Column(DateTime)
    expiry_date = Column(DateTime)
    batch_size = Column(Float)
    batch_size_unit = Column(String)
    status = Column(String)
    manufacturing_site = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    raw_materials = relationship("BatchRawMaterial", back_populates="batch_lot")
    quality_tests = relationship("BatchQualityTest", back_populates="batch_lot")

class BatchRawMaterial(Base):
    __tablename__ = 'batch_raw_materials'
    
    id = Column(Integer, primary_key=True, index=True)
    material_code = Column(String, nullable=False)
    material_name = Column(String, nullable=False)
    supplier_name = Column(String)
    supplier_lot = Column(String)
    quantity_used = Column(Float)
    unit = Column(String)
    material_grade = Column(String)
    certificate_number = Column(String)
    batch_number = Column(String)
    lot_number = Column(String)
    batch_lot_id = Column(Integer, ForeignKey('batch_lots.id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    batch_lot = relationship("BatchLot", back_populates="raw_materials")

class BatchQualityTest(Base):
    __tablename__ = 'batch_quality_tests'
    
    id = Column(Integer, primary_key=True, index=True)
    test_code = Column(String, nullable=False)
    test_name = Column(String, nullable=False)
    test_method = Column(String)
    specification = Column(String)
    result_value = Column(String)
    result_unit = Column(String)
    test_status = Column(String)
    test_date = Column(DateTime)
    analyst_name = Column(String)
    batch_number = Column(String)
    lot_number = Column(String)
    batch_lot_id = Column(Integer, ForeignKey('batch_lots.id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    batch_lot = relationship("BatchLot", back_populates="quality_tests")

# Create tables
Base.metadata.create_all(bind=engine)

# FastAPI app
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Backend Configuration with insertion order
BACKEND_CONFIG = {
    "domains": [
        {
            "domainName": "manufacturing_process",
            "displayName": "Manufacturing Process",
            "insertionOrder": [
                "manufacturing_steps",
                "step_categories",
                "in_process_controls", 
                "manufacturing_substeps",
                "process_parameters",
                "equipment_setup"
            ],
            "tables": [
                {
                    "tableName": "manufacturing_steps",
                    "displayName": "Manufacturing Steps",
                    "businessKeys": ["step_code", "step_name"],
                    "primaryKeyColumn": "id",
                    "columns": [
                        {"name": "step_code", "type": "text", "required": True},
                        {"name": "step_name", "type": "text", "required": True},
                        {"name": "step_type", "type": "dropdown", "required": True,
                         "options": ["Synthesis", "Purification", "Crystallization", "Drying", "Milling", "Blending"]},
                        {"name": "description", "type": "textarea", "required": False},
                        {"name": "sequence_number", "type": "number", "required": True},
                        {"name": "duration_hours", "type": "number", "required": False},
                        {"name": "temperature_range", "type": "text", "required": False},
                        {"name": "pressure_range", "type": "text", "required": False},
                        {"name": "critical_quality_attributes", "type": "textarea", "required": False},
                        {"name": "safety_level", "type": "dropdown", "required": True,
                         "options": ["Low", "Medium", "High", "Critical"]}
                    ],
                    "relationships": None
                },
                {
                    "tableName": "manufacturing_substeps",
                    "displayName": "Manufacturing Sub-steps",
                    "businessKeys": ["substep_code", "substep_name"],
                    "primaryKeyColumn": "id",
                    "columns": [
                        {"name": "substep_code", "type": "text", "required": True},
                        {"name": "substep_name", "type": "text", "required": True},
                        {"name": "substep_type", "type": "dropdown", "required": True,
                         "options": ["Preparation", "Execution", "Monitoring", "Completion", "Verification"]},
                        {"name": "description", "type": "textarea", "required": False},
                        {"name": "sequence_number", "type": "number", "required": True},
                        {"name": "duration_minutes", "type": "number", "required": True},
                        {"name": "operator_count", "type": "number", "required": True},
                        {"name": "skill_level_required", "type": "dropdown", "required": True,
                         "options": ["Junior", "Intermediate", "Senior", "Expert"]},
                        {"name": "equipment_required", "type": "text", "required": False},
                        {"name": "safety_notes", "type": "textarea", "required": False}
                    ],
                    "relationships": {
                        "type": "many",
                        "parentTable": "manufacturing_steps",
                        "parentKeys": ["step_code", "step_name"],
                        "childKeys": ["parent_step_code", "parent_step_name"]
                    }
                },
                {
                    "tableName": "process_parameters",
                    "displayName": "Process Parameters",
                    "businessKeys": ["parameter_code"],
                    "primaryKeyColumn": "id",
                    "columns": [
                        {"name": "parameter_code", "type": "text", "required": True},
                        {"name": "parameter_name", "type": "text", "required": True},
                        {"name": "parameter_type", "type": "dropdown", "required": True,
                         "options": ["Temperature", "Pressure", "pH", "Flow Rate", "Concentration", "Time", "Speed", "Volume"]},
                        {"name": "nominal_value", "type": "text", "required": True},
                        {"name": "lower_limit", "type": "text", "required": True},
                        {"name": "upper_limit", "type": "text", "required": True},
                        {"name": "unit_of_measure", "type": "text", "required": True},
                        {"name": "criticality", "type": "dropdown", "required": True,
                         "options": ["Critical", "Major", "Minor"]},
                        {"name": "monitoring_frequency", "type": "dropdown", "required": True,
                         "options": ["Continuous", "Every 15 min", "Every 30 min", "Hourly", "Once per batch"]},
                        {"name": "control_strategy", "type": "textarea", "required": False},
                        {"name": "deviation_procedure", "type": "textarea", "required": False}
                    ],
                    "relationships": {
                        "type": "many",
                        "parentTable": "manufacturing_substeps",
                        "parentKeys": ["substep_code", "substep_name", "parent_step_code", "parent_step_name"],
                        "childKeys": ["substep_code", "substep_name", "step_code", "step_name"]
                    }
                },
                {
                    "tableName": "equipment_setup",
                    "displayName": "Equipment Setup",
                    "businessKeys": ["setup_id"],
                    "primaryKeyColumn": "id",
                    "columns": [
                        {"name": "setup_id", "type": "text", "required": True},
                        {"name": "equipment_id", "type": "text", "required": True},
                        {"name": "equipment_name", "type": "text", "required": True},
                        {"name": "equipment_type", "type": "dropdown", "required": True,
                         "options": ["Reactor", "Filter", "Dryer", "Mill", "Blender", "Centrifuge", "Crystallizer"]},
                        {"name": "setup_parameters", "type": "textarea", "required": True},
                        {"name": "cleaning_requirements", "type": "dropdown", "required": True,
                         "options": ["Clean", "Clean and Steam", "Clean, Steam and Sterilize"]},
                        {"name": "calibration_status", "type": "dropdown", "required": True,
                         "options": ["Valid", "Due Soon", "Expired"]},
                        {"name": "qualification_status", "type": "dropdown", "required": True,
                         "options": ["Qualified", "Requalification Needed", "Not Qualified"]}
                    ],
                    "relationships": {
                        "type": "many",
                        "parentTable": "manufacturing_substeps",
                        "parentKeys": ["substep_code", "substep_name"],
                        "childKeys": ["substep_code", "substep_name"]
                    }
                },
                {
                    "tableName": "in_process_controls",
                    "displayName": "In-Process Controls",
                    "businessKeys": ["control_id"],
                    "primaryKeyColumn": "id",
                    "columns": [
                        {"name": "control_id", "type": "text", "required": True},
                        {"name": "control_name", "type": "text", "required": True},
                        {"name": "control_type", "type": "dropdown", "required": True,
                         "options": ["Physical", "Chemical", "Microbiological", "Environmental"]},
                        {"name": "specification", "type": "text", "required": True},
                        {"name": "test_method", "type": "text", "required": True},
                        {"name": "sampling_point", "type": "text", "required": True},
                        {"name": "sampling_frequency", "type": "dropdown", "required": True,
                         "options": ["Start", "Middle", "End", "Every Hour", "Every Batch"]},
                        {"name": "acceptance_criteria", "type": "textarea", "required": True},
                        {"name": "out_of_spec_procedure", "type": "textarea", "required": False}
                    ],
                    "relationships": {
                        "type": "many",
                        "parentTable": "manufacturing_steps",
                        "parentKeys": ["step_code", "step_name"],
                        "childKeys": ["step_code", "step_name"]
                    }
                },
                {
                    "tableName": "step_categories",
                    "displayName": "Step Categories",
                    "businessKeys": ["category_code"],
                    "primaryKeyColumn": "id",
                    "columns": [
                        {"name": "category_code", "type": "text", "required": True},
                        {"name": "category_name", "type": "text", "required": True},
                        {"name": "category_type", "type": "dropdown", "required": True, 
                         "options": ["Chemical", "Physical", "Biological", "Quality Control"]},
                        {"name": "regulatory_requirements", "type": "textarea", "required": False},
                        {"name": "validation_criteria", "type": "textarea", "required": False},
                        {"name": "documentation_level", "type": "dropdown", "required": True,
                         "options": ["Standard", "Enhanced", "Critical"]}
                    ],
                    "relationships": {
                        "type": "one",
                        "parentTable": "manufacturing_steps",
                        "parentKeys": ["step_code"],
                        "childKeys": ["step_code"]
                    }
                }
            ]
        },
        {
            "domainName": "batch_lot_info",
            "displayName": "Batch Lot Information",
            "insertionOrder": [
                "batch_lots",
                "batch_raw_materials",
                "batch_quality_tests"
            ],
            "tables": [
                {
                    "tableName": "batch_lots",
                    "displayName": "Batch Lots",
                    "businessKeys": ["batch_number", "lot_number"],
                    "primaryKeyColumn": "id",
                    "columns": [
                        {"name": "batch_number", "type": "text", "required": True},
                        {"name": "lot_number", "type": "text", "required": True},
                        {"name": "product_code", "type": "text", "required": True},
                        {"name": "product_name", "type": "text", "required": True},
                        {"name": "manufacture_date", "type": "date", "required": True},
                        {"name": "expiry_date", "type": "date", "required": True},
                        {"name": "batch_size", "type": "number", "required": True},
                        {"name": "batch_size_unit", "type": "dropdown", "required": True,
                         "options": ["kg", "L", "tablets", "vials"]},
                        {"name": "status", "type": "dropdown", "required": True,
                         "options": ["In Progress", "Completed", "Released", "Rejected", "On Hold"]},
                        {"name": "manufacturing_site", "type": "text", "required": True}
                    ],
                    "relationships": None
                },
                {
                    "tableName": "batch_raw_materials",
                    "displayName": "Raw Materials Used",
                    "businessKeys": ["material_code"],
                    "primaryKeyColumn": "id",
                    "columns": [
                        {"name": "material_code", "type": "text", "required": True},
                        {"name": "material_name", "type": "text", "required": True},
                        {"name": "supplier_name", "type": "text", "required": True},
                        {"name": "supplier_lot", "type": "text", "required": True},
                        {"name": "quantity_used", "type": "number", "required": True},
                        {"name": "unit", "type": "dropdown", "required": True,
                         "options": ["kg", "g", "mg", "L", "mL"]},
                        {"name": "material_grade", "type": "dropdown", "required": True,
                         "options": ["USP", "EP", "JP", "BP", "Technical"]},
                        {"name": "certificate_number", "type": "text", "required": False}
                    ],
                    "relationships": {
                        "type": "many",
                        "parentTable": "batch_lots",
                        "parentKeys": ["batch_number", "lot_number"],
                        "childKeys": ["batch_number", "lot_number"]
                    }
                },
                {
                    "tableName": "batch_quality_tests",
                    "displayName": "Quality Test Results",
                    "businessKeys": ["test_code"],
                    "primaryKeyColumn": "id",
                    "columns": [
                        {"name": "test_code", "type": "text", "required": True},
                        {"name": "test_name", "type": "text", "required": True},
                        {"name": "test_method", "type": "text", "required": True},
                        {"name": "specification", "type": "text", "required": True},
                        {"name": "result_value", "type": "text", "required": True},
                        {"name": "result_unit", "type": "text", "required": False},
                        {"name": "test_status", "type": "dropdown", "required": True,
                         "options": ["Pass", "Fail", "Pending", "OOS Investigation"]},
                        {"name": "test_date", "type": "date", "required": True},
                        {"name": "analyst_name", "type": "text", "required": True}
                    ],
                    "relationships": {
                        "type": "many",
                        "parentTable": "batch_lots",
                        "parentKeys": ["batch_number", "lot_number"],
                        "childKeys": ["batch_number", "lot_number"]
                    }
                }
            ]
        }
    ]
}

# Frontend Configuration
FRONTEND_CONFIG = {
    "views": [
        {
            "viewName": "manufacturing_process_view",
            "domainName": "manufacturing_process",
            "filters": [
                {
                    "name": "plant",
                    "displayName": "Manufacturing Plant",
                    "type": "dropdown",
                    "required": True,
                    "options": ["Plant A - New Jersey", "Plant B - California", "Plant C - Texas", "Plant D - Ireland"],
                    "placeholder": "Select Plant"
                },
                {
                    "name": "product_line",
                    "displayName": "Product Line",
                    "type": "dropdown",
                    "required": True,
                    "options": ["API Line 1", "API Line 2", "API Line 3", "Formulation Line A", "Formulation Line B"],
                    "placeholder": "Select Product Line"
                },
                {
                    "name": "process_version",
                    "displayName": "Process Version",
                    "type": "dropdown",
                    "required": True,
                    "options": ["Version 1.0", "Version 2.0", "Version 2.1", "Version 3.0", "Version 3.1 (Draft)"],
                    "placeholder": "Select Version"
                },
                {
                    "name": "campaign_id",
                    "displayName": "Campaign ID",
                    "type": "text",
                    "required": False,
                    "placeholder": "e.g., CAMP-2024-001"
                }
            ],
            "displayColumns": {
                "manufacturing_steps": [
                    {"columnName": "step_code", "displayName": "Step Code", "width": "100px"},
                    {"columnName": "step_name", "displayName": "Step Name", "width": "180px"},
                    {"columnName": "step_type", "displayName": "Type", "width": "120px"},
                    {"columnName": "sequence_number", "displayName": "Seq", "width": "60px"},
                    {"columnName": "duration_hours", "displayName": "Duration (hrs)", "width": "100px"},
                    {"columnName": "temperature_range", "displayName": "Temperature", "width": "120px"},
                    {"columnName": "safety_level", "displayName": "Safety", "width": "80px"}
                ],
                "manufacturing_substeps": [
                    {"columnName": "substep_code", "displayName": "Sub-step Code", "width": "120px"},
                    {"columnName": "substep_name", "displayName": "Sub-step Name", "width": "180px"},
                    {"columnName": "substep_type", "displayName": "Type", "width": "100px"},
                    {"columnName": "sequence_number", "displayName": "Seq", "width": "60px"},
                    {"columnName": "duration_minutes", "displayName": "Duration (min)", "width": "100px"},
                    {"columnName": "skill_level_required", "displayName": "Skill Level", "width": "100px"}
                ],
                "process_parameters": [
                    {"columnName": "parameter_code", "displayName": "Parameter Code", "width": "140px"},
                    {"columnName": "parameter_name", "displayName": "Parameter Name", "width": "180px"},
                    {"columnName": "parameter_type", "displayName": "Type", "width": "100px"},
                    {"columnName": "nominal_value", "displayName": "Nominal", "width": "80px"},
                    {"columnName": "lower_limit", "displayName": "Lower", "width": "80px"},
                    {"columnName": "upper_limit", "displayName": "Upper", "width": "80px"},
                    {"columnName": "unit_of_measure", "displayName": "Unit", "width": "80px"},
                    {"columnName": "criticality", "displayName": "Criticality", "width": "100px"}
                ],
                "equipment_setup": [
                    {"columnName": "setup_id", "displayName": "Setup ID", "width": "120px"},
                    {"columnName": "equipment_id", "displayName": "Equipment ID", "width": "100px"},
                    {"columnName": "equipment_name", "displayName": "Equipment Name", "width": "200px"},
                    {"columnName": "equipment_type", "displayName": "Type", "width": "120px"},
                    {"columnName": "calibration_status", "displayName": "Calibration", "width": "100px"}
                ],
                "in_process_controls": [
                    {"columnName": "control_id", "displayName": "Control ID", "width": "120px"},
                    {"columnName": "control_name", "displayName": "Control Name", "width": "200px"},
                    {"columnName": "control_type", "displayName": "Type", "width": "100px"},
                    {"columnName": "specification", "displayName": "Specification", "width": "150px"},
                    {"columnName": "sampling_frequency", "displayName": "Frequency", "width": "120px"}
                ],
                "step_categories": [
                    {"columnName": "category_code", "displayName": "Category Code", "width": "120px"},
                    {"columnName": "category_name", "displayName": "Category Name", "width": "200px"},
                    {"columnName": "category_type", "displayName": "Type", "width": "120px"},
                    {"columnName": "documentation_level", "displayName": "Doc Level", "width": "100px"}
                ]
            }
        },
        {
            "viewName": "batch_lot_view",
            "domainName": "batch_lot_info",
            "filters": [
                {
                    "name": "year",
                    "displayName": "Year",
                    "type": "dropdown",
                    "required": True,
                    "options": ["2024", "2023", "2022", "2021"],
                    "placeholder": "Select Year"
                },
                {
                    "name": "product",
                    "displayName": "Product",
                    "type": "dropdown",
                    "required": True,
                    "options": ["Product Alpha", "Product Beta", "Product Gamma", "Product Delta"],
                    "placeholder": "Select Product"
                },
                {
                    "name": "site",
                    "displayName": "Manufacturing Site",
                    "type": "dropdown",
                    "required": True,
                    "options": ["Site 1 - US", "Site 2 - EU", "Site 3 - Asia"],
                    "placeholder": "Select Site"
                },
                {
                    "name": "batch_range",
                    "displayName": "Batch Number Range",
                    "type": "text",
                    "required": False,
                    "placeholder": "e.g., BT-2024-001 to BT-2024-100"
                }
            ],
            "displayColumns": {
                "batch_lots": [
                    {"columnName": "batch_number", "displayName": "Batch #", "width": "120px"},
                    {"columnName": "lot_number", "displayName": "Lot #", "width": "120px"},
                    {"columnName": "product_code", "displayName": "Product Code", "width": "120px"},
                    {"columnName": "product_name", "displayName": "Product Name", "width": "200px"},
                    {"columnName": "manufacture_date", "displayName": "Mfg Date", "width": "120px"},
                    {"columnName": "status", "displayName": "Status", "width": "120px"}
                ],
                "batch_raw_materials": [
                    {"columnName": "material_code", "displayName": "Material Code", "width": "120px"},
                    {"columnName": "material_name", "displayName": "Material Name", "width": "200px"},
                    {"columnName": "quantity_used", "displayName": "Quantity", "width": "100px"},
                    {"columnName": "unit", "displayName": "Unit", "width": "80px"}
                ],
                "batch_quality_tests": [
                    {"columnName": "test_code", "displayName": "Test Code", "width": "120px"},
                    {"columnName": "test_name", "displayName": "Test Name", "width": "200px"},
                    {"columnName": "result_value", "displayName": "Result", "width": "120px"},
                    {"columnName": "test_status", "displayName": "Status", "width": "100px"}
                ]
            }
        }
    ]
}

# Table name to model mapping
TABLE_MODEL_MAP = {
    "manufacturing_steps": ManufacturingStep,
    "manufacturing_substeps": ManufacturingSubstep,
    "process_parameters": ProcessParameter,
    "equipment_setup": EquipmentSetup,
    "in_process_controls": InProcessControl,
    "step_categories": StepCategory,
    "batch_lots": BatchLot,
    "batch_raw_materials": BatchRawMaterial,
    "batch_quality_tests": BatchQualityTest
}

# Helper functions
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_table_config(domain_name: str, table_name: str) -> Optional[TableConfig]:
    """Get table configuration for a specific table"""
    for domain in BACKEND_CONFIG["domains"]:
        if domain["domainName"] == domain_name:
            for table in domain["tables"]:
                if table["tableName"] == table_name:
                    return table
    return None

def row_to_dict(row, table_name: str, domain_name: str):
    """Convert SQLAlchemy row to dictionary with primary key reference"""
    if row is None:
        return None
    
    # Get table config to find primary key column
    table_config = get_table_config(domain_name, table_name)
    if not table_config:
        pk_column = "id"
    else:
        pk_column = table_config.get("primaryKeyColumn", "id")
    
    # Get all column data
    result = {column.name: getattr(row, column.name) for column in row.__table__.columns}
    
    # Convert datetime to ISO format
    for key, value in result.items():
        if isinstance(value, datetime):
            result[key] = value.isoformat()
    
    # Add primary key reference
    pk_value = getattr(row, pk_column)
    result["_pk"] = {
        "tableName": table_name,
        "primaryKeyValue": pk_value
    }
    
    return result

def init_test_data():
    """Initialize database with test data"""
    db = SessionLocal()
    
    # Check if data already exists
    if db.query(ManufacturingStep).count() > 0:
        db.close()
        return
    
    # Add test data for manufacturing steps
    test_steps = [
        ManufacturingStep(
            step_code="SYNTH-001",
            step_name="Initial Synthesis",
            step_type="Synthesis",
            description="Primary synthesis of active pharmaceutical ingredient using controlled reaction conditions",
            sequence_number=1,
            duration_hours=8,
            temperature_range="20-25°C",
            pressure_range="1-2 bar",
            critical_quality_attributes="Purity >98%, Yield >85%, Correct polymorph",
            safety_level="High"
        ),
        ManufacturingStep(
            step_code="CRYST-002",
            step_name="Crystallization",
            step_type="Crystallization",
            description="Controlled crystallization to obtain desired crystal form and particle size",
            sequence_number=2,
            duration_hours=12,
            temperature_range="0-5°C",
            pressure_range="Atmospheric",
            critical_quality_attributes="Crystal form A, Particle size D90 <100μm",
            safety_level="Medium"
        ),
        ManufacturingStep(
            step_code="FILT-003",
            step_name="Filtration and Drying",
            step_type="Drying",
            description="Filter crystals and dry under vacuum to remove residual solvents",
            sequence_number=3,
            duration_hours=6,
            temperature_range="40-50°C",
            pressure_range="50-100 mbar",
            critical_quality_attributes="Moisture content <0.5%, No solvent residues above ICH limits",
            safety_level="Low"
        )
    ]
    
    for step in test_steps:
        db.add(step)
    
    db.commit()
    
    # Add test substeps
    synth_step = db.query(ManufacturingStep).filter_by(step_code="SYNTH-001").first()
    cryst_step = db.query(ManufacturingStep).filter_by(step_code="CRYST-002").first()
    
    test_substeps = [
        ManufacturingSubstep(
            substep_code="SYNTH-001-A",
            substep_name="Reagent Preparation",
            substep_type="Preparation",
            description="Prepare and charge reagents under inert atmosphere",
            sequence_number=1,
            duration_minutes=60,
            operator_count=2,
            skill_level_required="Senior",
            equipment_required="Reactor R-101, Scale SC-001, Nitrogen line",
            safety_notes="Use appropriate PPE, ensure proper ventilation, inert atmosphere required",
            parent_step_code="SYNTH-001",
            parent_step_name="Initial Synthesis",
            parent_step_id=synth_step.id
        ),
        ManufacturingSubstep(
            substep_code="SYNTH-001-B",
            substep_name="Reaction Initiation",
            substep_type="Execution",
            description="Start reaction under controlled temperature and agitation",
            sequence_number=2,
            duration_minutes=120,
            operator_count=1,
            skill_level_required="Expert",
            equipment_required="Reactor R-101, Temperature controller TC-001",
            safety_notes="Monitor temperature closely, emergency cooling ready, exothermic reaction",
            parent_step_code="SYNTH-001",
            parent_step_name="Initial Synthesis",
            parent_step_id=synth_step.id
        ),
        ManufacturingSubstep(
            substep_code="CRYST-002-A",
            substep_name="Solution Preparation",
            substep_type="Preparation",
            description="Dissolve crude product in minimum solvent at elevated temperature",
            sequence_number=1,
            duration_minutes=90,
            operator_count=2,
            skill_level_required="Senior",
            equipment_required="Crystallizer CR-001, Heating system",
            safety_notes="Hot solution handling, use thermal gloves",
            parent_step_code="CRYST-002",
            parent_step_name="Crystallization",
            parent_step_id=cryst_step.id
        )
    ]
    
    for substep in test_substeps:
        db.add(substep)
    
    db.commit()
    
    # Add test batch lots
    test_batch = BatchLot(
        batch_number="BT-2024-001",
        lot_number="LOT-2024-001-A",
        product_code="API-001",
        product_name="Active Pharmaceutical Ingredient Alpha",
        manufacture_date=datetime(2024, 1, 15),
        expiry_date=datetime(2026, 1, 14),
        batch_size=250.0,
        batch_size_unit="kg",
        status="Released",
        manufacturing_site="Plant A - New Jersey"
    )
    db.add(test_batch)
    db.commit()
    
    db.close()

# Initialize test data on startup
init_test_data()

# API Endpoints
@app.get("/")
def read_root():
    return {"message": "CMC Data Management API"}

@app.get("/api/config/backend", response_model=BackendConfig)
def get_backend_config():
    return BACKEND_CONFIG

@app.get("/api/config/frontend", response_model=FrontendConfig)
def get_frontend_config():
    return FRONTEND_CONFIG

@app.get("/api/config/domain/{domain_name}", response_model=DomainConfig)
def get_domain_config(domain_name: str):
    for domain in BACKEND_CONFIG["domains"]:
        if domain["domainName"] == domain_name:
            return domain
    raise HTTPException(status_code=404, detail=f"Domain {domain_name} not found")

@app.get("/api/data/{domain_name}/{table_name}")
def get_data(domain_name: str, table_name: str, db: Session = Depends(get_db), 
             parent_keys: Optional[str] = None):
    """
    Get data for a table, optionally filtered by parent keys
    parent_keys format: "key1=value1,key2=value2"
    """
    full_table_name = f"{domain_name}.{table_name}"
    
    # Get the model class
    model_class = TABLE_MODEL_MAP.get(table_name)
    if not model_class:
        raise HTTPException(status_code=404, detail=f"Table {table_name} not found")
    
    # Start query
    query = db.query(model_class)
    
    # Apply parent key filters if provided
    if parent_keys:
        try:
            # Parse parent_keys string into dict
            filters = {}
            for pair in parent_keys.split(','):
                key, value = pair.split('=')
                filters[key] = value
            
            # Apply filters
            for key, value in filters.items():
                if hasattr(model_class, key):
                    query = query.filter(getattr(model_class, key) == value)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid parent_keys format: {str(e)}")
    
    # Execute query
    records = query.all()
    
    # Convert to dict with primary key references
    data = [row_to_dict(record, table_name, domain_name) for record in records]
    
    return {"data": data, "count": len(data)}

@app.post("/api/data/{domain_name}/{table_name}")
def save_data(domain_name: str, table_name: str, record: DataRecord, db: Session = Depends(get_db)):
    """
    TEMPORARY: Save individual record - this will be replaced by writeback function
    In production, this would be disabled and all saves would go through writeback
    """
    model_class = TABLE_MODEL_MAP.get(table_name)
    if not model_class:
        raise HTTPException(status_code=404, detail=f"Table {table_name} not found")
    
    # Extract data from record
    record_dict = record.dict()
    
    # Remove primary key reference if it exists
    record_dict.pop('_pk', None)
    
    # Get table config
    table_config = get_table_config(domain_name, table_name)
    pk_column = table_config.get("primaryKeyColumn", "id") if table_config else "id"
    
    # Check if this is an update or insert
    pk_value = record_dict.get(pk_column)
    
    # Handle foreign key relationships
    if table_name == "manufacturing_substeps":
        # Find parent step by business keys
        parent_step = db.query(ManufacturingStep).filter_by(
            step_code=record_dict.get('parent_step_code')
        ).first()
        if parent_step:
            record_dict['parent_step_id'] = parent_step.id
    
    elif table_name == "process_parameters":
        # Find parent substep
        parent_substep = db.query(ManufacturingSubstep).filter_by(
            substep_code=record_dict.get('substep_code'),
            substep_name=record_dict.get('substep_name')
        ).first()
        if parent_substep:
            record_dict['substep_id'] = parent_substep.id
    
    elif table_name == "equipment_setup":
        # Find parent substep
        parent_substep = db.query(ManufacturingSubstep).filter_by(
            substep_code=record_dict.get('substep_code'),
            substep_name=record_dict.get('substep_name')
        ).first()
        if parent_substep:
            record_dict['substep_id'] = parent_substep.id
    
    elif table_name == "in_process_controls":
        # Find parent step
        parent_step = db.query(ManufacturingStep).filter_by(
            step_code=record_dict.get('step_code')
        ).first()
        if parent_step:
            record_dict['step_id'] = parent_step.id
    
    elif table_name == "step_categories":
        # Find parent step
        parent_step = db.query(ManufacturingStep).filter_by(
            step_code=record_dict.get('step_code')
        ).first()
        if parent_step:
            record_dict['step_id'] = parent_step.id
    
    elif table_name in ["batch_raw_materials", "batch_quality_tests"]:
        # Find parent batch lot
        parent_batch = db.query(BatchLot).filter_by(
            batch_number=record_dict.get('batch_number'),
            lot_number=record_dict.get('lot_number')
        ).first()
        if parent_batch:
            record_dict['batch_lot_id'] = parent_batch.id
    
    # Handle date conversions
    for key, value in record_dict.items():
        if key.endswith('_date') and value and isinstance(value, str):
            try:
                record_dict[key] = datetime.fromisoformat(value.replace('Z', '+00:00'))
            except:
                pass
    
    if pk_value:
        # Update existing record
        db_record = db.query(model_class).filter(getattr(model_class, pk_column) == pk_value).first()
        if not db_record:
            raise HTTPException(status_code=404, detail="Record not found")
        
        for key, value in record_dict.items():
            if hasattr(db_record, key) and key != pk_column:
                setattr(db_record, key, value)
        
        db_record.updated_at = datetime.utcnow()
    else:
        # Create new record
        # Remove id field if it exists and is None
        record_dict.pop(pk_column, None)
        db_record = model_class(**record_dict)
        db.add(db_record)
    
    try:
        db.commit()
        db.refresh(db_record)
        return {"success": True, "data": row_to_dict(db_record, table_name, domain_name)}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/writeback/{domain_name}")
def writeback_domain(domain_name: str, data: Dict[str, List[DataRecord]], db: Session = Depends(get_db)):
    """
    Writeback endpoint for saving all domain data at once
    This endpoint handles complex insertion order and foreign key dependencies
    
    Args:
        domain_name: The domain to save data for
        data: Dictionary with table names as keys and lists of records as values
    
    This is a placeholder - actual implementation will handle:
    - Transaction management
    - Foreign key resolution
    - Insertion order based on domain config
    - Error handling and rollback
    - Validation
    """
    # Get domain config to find insertion order
    domain_config = None
    for domain in BACKEND_CONFIG["domains"]:
        if domain["domainName"] == domain_name:
            domain_config = domain
            break
    
    if not domain_config:
        raise HTTPException(status_code=404, detail=f"Domain {domain_name} not found")
    
    insertion_order = domain_config.get("insertionOrder", [])
    
    # TODO: Implement the actual writeback logic
    # This will be implemented in the next prompt
    return {
        "success": False,
        "message": "Writeback not yet implemented",
        "insertion_order": insertion_order,
        "tables_received": list(data.keys())
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
