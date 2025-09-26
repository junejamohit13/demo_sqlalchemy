import React from "react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

type Props = ToasterProps;

const Toaster: React.FC<Props> = ({ ...props }) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      {...props}
    />
  );
};

export { Toaster };
import React, { useState, useEffect } from 'react';
import {
  Button,
  Tabs,
  Tag,
  Input,
  Select,
  Table,
  Modal,
  Space,
  Typography,
  Popover,
  Divider,
  Row,
  Col,
  DatePicker,
  InputNumber,
  Switch,
  Tooltip,
  Alert,
  Form
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TabsProps } from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  CopyOutlined,
  CloseOutlined,
  DatabaseOutlined,
  ExportOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import { Building, Users, FolderOpen, CheckSquare } from 'lucide-react';

// Generic Data Types
export interface BaseEntity {
  id: string;
  businessKey: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any; // Allow additional properties
}

export interface DataStore {
  [tableName: string]: BaseEntity[];
}

// Filter Types
interface FilterCondition {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between' | 'in' | 'dateAfter' | 'dateBefore' | 'dateBetween';
  value: string | number | string[] | { start: string; end: string };
}

interface FilterSet {
  id: string;
  name: string;
  conditions: FilterCondition[];
}

interface Filters {
  [key: string]: FilterCondition[];
}

// Field Configuration
export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'date' | 'textarea' | 'select' | 'multiselect' | 'boolean' | 'phone' | 'url';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  dependsOn?: string; // Table name this field depends on
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: (value: any) => boolean | string;
  };
  display?: {
    showInTable?: boolean;
    tableOrder?: number;
    groupWith?: string;
  };
}

// Table Configuration
export interface TableConfig {
  id: string;
  name: string;
  icon: React.ReactNode;
  businessKeyPrefix: string;
  dependencies: string[]; // Other table IDs this depends on
  fields: FieldConfig[];
  display?: {
    defaultSort?: string;
    pageSize?: number;
    allowDuplicate?: boolean;
    allowDelete?: boolean;
  };
}

// Component Props Interface
export interface EnhancedDataEntrySystemProps {
  tableConfigs: TableConfig[];
  initialData?: DataStore;
  onDataChange?: (data: DataStore) => void;
  theme?: {
    primaryColor?: string;
    borderRadius?: string;
  };
}

// Default configurations for the business example
const defaultTableConfigs: TableConfig[] = [
  {
    id: 'companies',
    name: 'Companies',
    icon: <Building size={18} />,
    businessKeyPrefix: 'COMP',
    dependencies: [],
    fields: [
      { 
        name: 'name', 
        label: 'Company Name', 
        type: 'text', 
        required: true, 
        placeholder: 'Enter company name',
        display: { showInTable: true, tableOrder: 1 }
      },
      { 
        name: 'industry', 
        label: 'Industry', 
        type: 'select', 
        placeholder: 'Select industry',
        options: [
          { value: 'Technology', label: 'Technology' },
          { value: 'Healthcare', label: 'Healthcare' },
          { value: 'Finance', label: 'Finance' },
          { value: 'Energy', label: 'Energy' },
          { value: 'Manufacturing', label: 'Manufacturing' },
          { value: 'Retail', label: 'Retail' },
          { value: 'Education', label: 'Education' },
          { value: 'Other', label: 'Other' }
        ],
        display: { showInTable: true, tableOrder: 2 }
      },
      { 
        name: 'website', 
        label: 'Website', 
        type: 'url', 
        placeholder: 'https://example.com',
        display: { showInTable: true, tableOrder: 3 }
      },
      { 
        name: 'address', 
        label: 'Address', 
        type: 'textarea', 
        placeholder: 'Enter company address',
        display: { showInTable: false }
      },
      { 
        name: 'phone', 
        label: 'Phone', 
        type: 'phone', 
        placeholder: '+1 (555) 123-4567',
        display: { showInTable: false }
      },
      { 
        name: 'employeeCount', 
        label: 'Employee Count', 
        type: 'number', 
        placeholder: 'Number of employees',
        validation: { min: 1 },
        display: { showInTable: true, tableOrder: 4 }
      }
    ]
  },
  {
    id: 'departments',
    name: 'Departments',
    icon: <Users size={18} />,
    businessKeyPrefix: 'DEPT',
    dependencies: ['companies'],
    fields: [
      { name: 'companyId', label: 'Company', type: 'select', required: true, dependsOn: 'companies' },
      { 
        name: 'name', 
        label: 'Department Name', 
        type: 'text', 
        required: true, 
        placeholder: 'Enter department name',
        display: { showInTable: true, tableOrder: 1 }
      },
      { 
        name: 'budget', 
        label: 'Budget', 
        type: 'number', 
        placeholder: 'Enter budget',
        validation: { min: 0 },
        display: { showInTable: true, tableOrder: 2 }
      },
      { 
        name: 'description', 
        label: 'Description', 
        type: 'textarea', 
        placeholder: 'Enter description',
        display: { showInTable: false }
      },
      { 
        name: 'isActive', 
        label: 'Active', 
        type: 'boolean',
        display: { showInTable: true, tableOrder: 3 }
      }
    ]
  },
  {
    id: 'employees',
    name: 'Employees',
    icon: <Users size={18} />,
    businessKeyPrefix: 'EMP',
    dependencies: ['companies'],
    fields: [
      { name: 'companyId', label: 'Company', type: 'select', required: true, dependsOn: 'companies' },
      { name: 'departmentId', label: 'Department (Optional)', type: 'select', dependsOn: 'departments' },
      { 
        name: 'firstName', 
        label: 'First Name', 
        type: 'text', 
        required: true, 
        placeholder: 'Enter first name',
        display: { showInTable: true, tableOrder: 1 }
      },
      { 
        name: 'lastName', 
        label: 'Last Name', 
        type: 'text', 
        required: true, 
        placeholder: 'Enter last name',
        display: { showInTable: true, tableOrder: 2 }
      },
      { 
        name: 'email', 
        label: 'Email', 
        type: 'email', 
        required: true, 
        placeholder: 'Enter email',
        display: { showInTable: true, tableOrder: 3 }
      },
      { 
        name: 'position', 
        label: 'Position', 
        type: 'text', 
        placeholder: 'Enter position',
        display: { showInTable: true, tableOrder: 4 }
      },
      { 
        name: 'salary', 
        label: 'Salary', 
        type: 'number', 
        placeholder: 'Enter salary',
        validation: { min: 0 },
        display: { showInTable: false }
      },
      { 
        name: 'phone', 
        label: 'Phone', 
        type: 'phone', 
        placeholder: '+1 (555) 123-4567',
        display: { showInTable: false }
      },
      { 
        name: 'startDate', 
        label: 'Start Date', 
        type: 'date',
        display: { showInTable: false }
      }
    ]
  },
  {
    id: 'projects',
    name: 'Projects',
    icon: <FolderOpen size={18} />,
    businessKeyPrefix: 'PROJ',
    dependencies: ['companies'],
    fields: [
      { name: 'companyId', label: 'Company', type: 'select', required: true, dependsOn: 'companies' },
      { 
        name: 'name', 
        label: 'Project Name', 
        type: 'text', 
        required: true, 
        placeholder: 'Enter project name',
        display: { showInTable: true, tableOrder: 1 }
      },
      { 
        name: 'startDate', 
        label: 'Start Date', 
        type: 'date', 
        required: true,
        display: { showInTable: true, tableOrder: 2 }
      },
      { 
        name: 'endDate', 
        label: 'End Date', 
        type: 'date',
        display: { showInTable: true, tableOrder: 3 }
      },
      { 
        name: 'status', 
        label: 'Status', 
        type: 'select', 
        options: [
          { value: 'Planning', label: 'Planning' },
          { value: 'In Progress', label: 'In Progress' },
          { value: 'Completed', label: 'Completed' },
          { value: 'On Hold', label: 'On Hold' },
          { value: 'Cancelled', label: 'Cancelled' }
        ],
        display: { showInTable: true, tableOrder: 4 }
      },
      { name: 'assignedEmployees', label: 'Assigned Employees', type: 'multiselect', dependsOn: 'employees' },
      { 
        name: 'description', 
        label: 'Description', 
        type: 'textarea', 
        placeholder: 'Enter project description',
        display: { showInTable: false }
      },
      { 
        name: 'budget', 
        label: 'Budget', 
        type: 'number', 
        placeholder: 'Enter budget',
        validation: { min: 0 },
        display: { showInTable: false }
      }
    ]
  },
  {
    id: 'tasks',
    name: 'Tasks',
    icon: <CheckSquare size={18} />,
    businessKeyPrefix: 'TASK',
    dependencies: ['projects'],
    fields: [
      { name: 'projectId', label: 'Project', type: 'select', required: true, dependsOn: 'projects' },
      { name: 'assignedEmployeeId', label: 'Assigned Employee', type: 'select', dependsOn: 'employees' },
      { 
        name: 'title', 
        label: 'Task Title', 
        type: 'text', 
        required: true, 
        placeholder: 'Enter task title',
        display: { showInTable: true, tableOrder: 1 }
      },
      { 
        name: 'description', 
        label: 'Description', 
        type: 'textarea', 
        placeholder: 'Enter task description',
        display: { showInTable: false }
      },
      { 
        name: 'priority', 
        label: 'Priority', 
        type: 'select', 
        options: [
          { value: 'Low', label: 'Low' },
          { value: 'Medium', label: 'Medium' },
          { value: 'High', label: 'High' },
          { value: 'Critical', label: 'Critical' }
        ],
        display: { showInTable: true, tableOrder: 2 }
      },
      { 
        name: 'status', 
        label: 'Status', 
        type: 'select', 
        options: [
          { value: 'Not Started', label: 'Not Started' },
          { value: 'In Progress', label: 'In Progress' },
          { value: 'Completed', label: 'Completed' },
          { value: 'On Hold', label: 'On Hold' }
        ],
        display: { showInTable: true, tableOrder: 3 }
      },
      { 
        name: 'dueDate', 
        label: 'Due Date', 
        type: 'date',
        display: { showInTable: true, tableOrder: 4 }
      },
      { 
        name: 'estimatedHours', 
        label: 'Estimated Hours', 
        type: 'number', 
        placeholder: 'Enter estimated hours',
        validation: { min: 0 },
        display: { showInTable: false }
      }
    ]
  }
];

// Default sample data
const defaultInitialData: DataStore = {
  companies: [
    {
      id: 'comp_1',
      businessKey: 'COMP-0001',
      name: 'Tech Solutions Inc',
      industry: 'Technology',
      website: 'https://techsolutions.com',
      address: '123 Innovation Drive, San Francisco, CA',
      phone: '+1 (555) 123-4567',
      employeeCount: 150,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 'comp_2',
      businessKey: 'COMP-0002',
      name: 'Green Energy Corp',
      industry: 'Energy',
      website: 'https://greenenergy.com',
      address: '456 Renewable Ave, Austin, TX',
      phone: '+1 (555) 987-6543',
      employeeCount: 75,
      createdAt: '2024-02-01T09:30:00Z',
      updatedAt: '2024-02-01T09:30:00Z'
    },
    {
      id: 'comp_3',
      businessKey: 'COMP-0003',
      name: 'Healthcare Plus',
      industry: 'Healthcare',
      website: 'https://healthcareplus.com',
      address: '789 Medical Center Blvd, Boston, MA',
      phone: '+1 (555) 456-7890',
      employeeCount: 200,
      createdAt: '2024-02-15T14:20:00Z',
      updatedAt: '2024-02-15T14:20:00Z'
    }
  ],
  departments: [
    {
      id: 'dept_1',
      businessKey: 'DEPT-0001',
      companyId: 'comp_1',
      name: 'Engineering',
      budget: 500000,
      description: 'Software development and technical operations',
      isActive: true,
      createdAt: '2024-01-16T11:00:00Z',
      updatedAt: '2024-01-16T11:00:00Z'
    },
    {
      id: 'dept_2',
      businessKey: 'DEPT-0002',
      companyId: 'comp_1',
      name: 'Marketing',
      budget: 200000,
      description: 'Brand management and customer acquisition',
      isActive: true,
      createdAt: '2024-01-17T13:30:00Z',
      updatedAt: '2024-01-17T13:30:00Z'
    },
    {
      id: 'dept_3',
      businessKey: 'DEPT-0003',
      companyId: 'comp_2',
      name: 'Research & Development',
      budget: 750000,
      description: 'Clean energy research and development',
      isActive: true,
      createdAt: '2024-02-02T10:15:00Z',
      updatedAt: '2024-02-02T10:15:00Z'
    }
  ],
  employees: [
    {
      id: 'emp_1',
      businessKey: 'EMP-0001',
      companyId: 'comp_1',
      departmentId: 'dept_1',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@techsolutions.com',
      position: 'Senior Developer',
      salary: 95000,
      phone: '+1 (555) 111-2222',
      startDate: '2023-03-15',
      createdAt: '2024-01-18T08:00:00Z',
      updatedAt: '2024-01-18T08:00:00Z'
    },
    {
      id: 'emp_2',
      businessKey: 'EMP-0002',
      companyId: 'comp_1',
      departmentId: 'dept_2',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@techsolutions.com',
      position: 'Marketing Manager',
      salary: 78000,
      phone: '+1 (555) 333-4444',
      startDate: '2023-06-01',
      createdAt: '2024-01-19T09:15:00Z',
      updatedAt: '2024-01-19T09:15:00Z'
    },
    {
      id: 'emp_3',
      businessKey: 'EMP-0003',
      companyId: 'comp_2',
      departmentId: 'dept_3',
      firstName: 'Michael',
      lastName: 'Chen',
      email: 'michael.chen@greenenergy.com',
      position: 'Research Scientist',
      salary: 105000,
      phone: '+1 (555) 555-6666',
      startDate: '2023-01-10',
      createdAt: '2024-02-03T07:45:00Z',
      updatedAt: '2024-02-03T07:45:00Z'
    }
  ],
  projects: [
    {
      id: 'proj_1',
      businessKey: 'PROJ-0001',
      companyId: 'comp_1',
      name: 'Mobile App Redesign',
      startDate: '2024-03-01',
      endDate: '2024-06-30',
      status: 'In Progress',
      description: 'Complete redesign of the mobile application interface',
      assignedEmployees: ['emp_1'],
      budget: 150000,
      createdAt: '2024-02-20T10:30:00Z',
      updatedAt: '2024-02-20T10:30:00Z'
    },
    {
      id: 'proj_2',
      businessKey: 'PROJ-0002',
      companyId: 'comp_2',
      name: 'Solar Panel Efficiency Study',
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      status: 'In Progress',
      description: 'Research project to improve solar panel efficiency by 15%',
      assignedEmployees: ['emp_3'],
      budget: 500000,
      createdAt: '2024-02-05T11:00:00Z',
      updatedAt: '2024-02-05T11:00:00Z'
    }
  ],
  tasks: [
    {
      id: 'task_1',
      businessKey: 'TASK-0001',
      projectId: 'proj_1',
      assignedEmployeeId: 'emp_1',
      title: 'Design new login screen',
      description: 'Create mockups and implement new login interface',
      priority: 'High',
      status: 'In Progress',
      dueDate: '2024-03-15',
      estimatedHours: 40,
      createdAt: '2024-02-21T14:20:00Z',
      updatedAt: '2024-02-21T14:20:00Z'
    },
    {
      id: 'task_2',
      businessKey: 'TASK-0002',
      projectId: 'proj_2',
      assignedEmployeeId: 'emp_3',
      title: 'Test new photovoltaic materials',
      description: 'Laboratory testing of advanced photovoltaic materials',
      priority: 'Critical',
      status: 'Not Started',
      dueDate: '2024-04-01',
      estimatedHours: 80,
      createdAt: '2024-02-06T09:30:00Z',
      updatedAt: '2024-02-06T09:30:00Z'
    }
  ]
};

export function EnhancedDataEntrySystem({
  tableConfigs = defaultTableConfigs,
  initialData = defaultInitialData,
  onDataChange,
  theme
}: EnhancedDataEntrySystemProps) {
  const [dataStore, setDataStore] = useState<DataStore>(initialData);
  const [activeTable, setActiveTable] = useState<string>(tableConfigs[0]?.id || '');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Filters>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [newCondition, setNewCondition] = useState<Partial<FilterCondition>>({ operator: 'equals' });

  // Reset search when switching tables
  useEffect(() => {
    setSearchTerm('');
    setShowAdvancedFilters(false);
    setNewCondition({ operator: 'equals' });
  }, [activeTable]);

  useEffect(() => {
    if (!showAdvancedFilters) {
      setNewCondition({ operator: 'equals' });
    }
  }, [showAdvancedFilters]);

  // Notify parent of data changes
  useEffect(() => {
    if (onDataChange) {
      onDataChange(dataStore);
    }
  }, [dataStore, onDataChange]);

  // Generate business key
  const generateBusinessKey = (prefix: string, existingItems: BaseEntity[]) => {
    const maxNumber = existingItems
      .filter(item => item.businessKey.startsWith(prefix))
      .map(item => parseInt(item.businessKey.split('-')[1]) || 0)
      .reduce((max, num) => Math.max(max, num), 0);
    return `${prefix}-${String(maxNumber + 1).padStart(4, '0')}`;
  };

  // Get default value for field type
  const getDefaultFieldValue = (field: FieldConfig): any => {
    switch (field.type) {
      case 'number':
        return 0;
      case 'boolean':
        return false;
      case 'multiselect':
        return [];
      case 'date':
        return '';
      default:
        return '';
    }
  };

  // Create new item
  const createNewItem = (tableId: string) => {
    const config = tableConfigs.find(t => t.id === tableId);
    if (!config) return;

    const newItem: BaseEntity = {
      id: `${tableId}_${Date.now()}`,
      businessKey: generateBusinessKey(config.businessKeyPrefix, dataStore[tableId] || []),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Initialize all fields with default values
    config.fields.forEach(field => {
      (newItem as any)[field.name] = getDefaultFieldValue(field);
    });

    setEditingItem(newItem);
    setShowEditDialog(true);
  };

  // Edit existing item
  const editItem = (item: BaseEntity) => {
    setEditingItem({ ...item });
    setShowEditDialog(true);
  };

  // Save item
  const saveItem = () => {
    if (!editingItem) return;

    const updatedItem = {
      ...editingItem,
      updatedAt: new Date().toISOString()
    };

    setDataStore(prev => {
      const tableData = prev[activeTable] || [];
      const existingIndex = tableData.findIndex((item: BaseEntity) => item.id === editingItem.id);
      const newData = [...tableData];
      
      if (existingIndex >= 0) {
        newData[existingIndex] = updatedItem;
        toast.success(`${tableConfigs.find(t => t.id === activeTable)?.name.slice(0, -1)} updated successfully`);
      } else {
        newData.push(updatedItem);
        toast.success(`${tableConfigs.find(t => t.id === activeTable)?.name.slice(0, -1)} created successfully`);
      }

      return { ...prev, [activeTable]: newData };
    });

    setShowEditDialog(false);
    setEditingItem(null);
  };

  // Delete item
  const deleteItem = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      setDataStore(prev => ({
        ...prev,
        [activeTable]: (prev[activeTable] || []).filter((item: BaseEntity) => item.id !== id)
      }));
      toast.success('Item deleted successfully');
    }
  };

  // Duplicate item
  const duplicateItem = (item: BaseEntity) => {
    const config = tableConfigs.find(t => t.id === activeTable);
    if (!config) return;

    const duplicatedItem = {
      ...item,
      id: `${activeTable}_${Date.now()}`,
      businessKey: generateBusinessKey(config.businessKeyPrefix, dataStore[activeTable] || []),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingItem(duplicatedItem);
    setShowEditDialog(true);
  };

  // Get options for select fields
  const getSelectOptions = (field: FieldConfig, editingCompanyId?: string): { value: string; label: string }[] => {
    if (field.options) return field.options;
    
    if (field.dependsOn) {
      const dependentData = dataStore[field.dependsOn] || [];
      
      // Filter departments by company if editing an employee
      if (field.dependsOn === 'departments' && editingCompanyId) {
        return dependentData
          .filter((item: any) => item.companyId === editingCompanyId)
          .map((item: any) => ({
            value: item.id,
            label: `${item.businessKey} - ${item.name || item.title || (item.firstName && item.lastName ? `${item.firstName} ${item.lastName}` : 'Unnamed')}`
          }));
      }
      
      // Filter employees by company if editing a project
      if (field.dependsOn === 'employees' && editingCompanyId) {
        return dependentData
          .filter((item: any) => item.companyId === editingCompanyId)
          .map((item: any) => ({
            value: item.id,
            label: `${item.businessKey} - ${item.firstName && item.lastName ? `${item.firstName} ${item.lastName}` : item.name || 'Unnamed'}`
          }));
      }
      
      return dependentData.map((item: any) => ({
        value: item.id,
        label: `${item.businessKey} - ${item.name || item.title || (item.firstName && item.lastName ? `${item.firstName} ${item.lastName}` : 'Unnamed')}`
      }));
    }
    
    return [];
  };

  // Apply filter condition
  const applyFilterCondition = (item: BaseEntity, condition: FilterCondition): boolean => {
    const fieldValue = item[condition.field];
    const { operator, value } = condition;

    if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
      return operator === 'equals' && (value === '' || value === null);
    }

    switch (operator) {
      case 'equals':
        return String(fieldValue).toLowerCase() === String(value).toLowerCase();
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
      case 'startsWith':
        return String(fieldValue).toLowerCase().startsWith(String(value).toLowerCase());
      case 'endsWith':
        return String(fieldValue).toLowerCase().endsWith(String(value).toLowerCase());
      case 'greaterThan':
        return Number(fieldValue) > Number(value);
      case 'lessThan':
        return Number(fieldValue) < Number(value);
      case 'between':
        if (typeof value === 'object' && 'start' in value && 'end' in value) {
          const numValue = Number(fieldValue);
          return numValue >= Number(value.start) && numValue <= Number(value.end);
        }
        return false;
      case 'in':
        if (Array.isArray(value)) {
          return value.includes(String(fieldValue));
        }
        return false;
      case 'dateAfter':
        return new Date(fieldValue) > new Date(String(value));
      case 'dateBefore':
        return new Date(fieldValue) < new Date(String(value));
      case 'dateBetween':
        if (typeof value === 'object' && 'start' in value && 'end' in value) {
          const itemDate = new Date(fieldValue);
          return itemDate >= new Date(value.start) && itemDate <= new Date(value.end);
        }
        return false;
      default:
        return true;
    }
  };

  // Filter items based on search and advanced filters
  const getFilteredItems = (): BaseEntity[] => {
    let items = dataStore[activeTable] || [];
    
    // Apply search filter
    if (searchTerm) {
      items = items.filter((item: BaseEntity) => 
        Object.values(item).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply advanced filters
    const tableFilters = filters[activeTable] || [];
    if (tableFilters.length > 0) {
      items = items.filter((item: BaseEntity) => 
        tableFilters.every(condition => applyFilterCondition(item, condition))
      );
    }

    return items;
  };

  // Add filter condition
  const addFilterCondition = (condition: FilterCondition) => {
    setFilters(prev => ({
      ...prev,
      [activeTable]: [...(prev[activeTable] || []), condition]
    }));
  };

  // Remove filter condition
  const removeFilterCondition = (index: number) => {
    setFilters(prev => ({
      ...prev,
      [activeTable]: (prev[activeTable] || []).filter((_, i) => i !== index)
    }));
  };

  // Clear all filters for current table
  const clearFilters = () => {
    setSearchTerm('');
    setFilters(prev => ({
      ...prev,
      [activeTable]: []
    }));
  };

  // Get filter operators for field type
  const getFilterOperators = (fieldType: string) => {
    switch (fieldType) {
      case 'text':
      case 'email':
      case 'textarea':
      case 'phone':
      case 'url':
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'contains', label: 'Contains' },
          { value: 'startsWith', label: 'Starts with' },
          { value: 'endsWith', label: 'Ends with' },
        ];
      case 'number':
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'greaterThan', label: 'Greater than' },
          { value: 'lessThan', label: 'Less than' },
          { value: 'between', label: 'Between' },
        ];
      case 'date':
        return [
          { value: 'equals', label: 'On date' },
          { value: 'dateAfter', label: 'After' },
          { value: 'dateBefore', label: 'Before' },
          { value: 'dateBetween', label: 'Between' },
        ];
      case 'select':
      case 'boolean':
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'in', label: 'One of' },
        ];
      default:
        return [{ value: 'equals', label: 'Equals' }];
    }
  };

  // Get filterable fields for current table
  const getFilterableFields = () => {
    const config = tableConfigs.find(t => t.id === activeTable);
    if (!config) return [];

    const fields = [
      { name: 'businessKey', label: 'Business Key', type: 'text' },
      ...config.fields,
      { name: 'createdAt', label: 'Created Date', type: 'date' },
      { name: 'updatedAt', label: 'Updated Date', type: 'date' },
    ];
    return fields;
  };

  
// Get current table config
const currentConfig = tableConfigs.find(t => t.id === activeTable);
if (!currentConfig) {
  return <div>No table configuration found</div>;
}

const filteredItems = getFilteredItems();
const activeFilters = filters[activeTable] || [];
const hasActiveFilters = Boolean(searchTerm) || activeFilters.length > 0;

const getTableFields = (config: TableConfig) =>
  config.fields
    .filter(field => field.display?.showInTable !== false)
    .sort((a, b) => (a.display?.tableOrder || 999) - (b.display?.tableOrder || 999))
    .slice(0, 4);

const renderFieldValue = (item: BaseEntity, field: FieldConfig) => {
  const value = item[field.name];

  if (value === undefined || value === null || value === '') {
    return <Typography.Text type="secondary">-</Typography.Text>;
  }

  switch (field.type) {
    case 'boolean':
      return <Tag color={value ? 'green' : 'default'}>{value ? 'Yes' : 'No'}</Tag>;
    case 'multiselect':
      return Array.isArray(value) && value.length > 0 ? (
        <Space size={[4, 4]} wrap>
          {value.map((id: string) => {
            const option = getSelectOptions(field, item.companyId).find(opt => opt.value === id);
            return <Tag key={id}>{option ? option.label : id}</Tag>;
          })}
        </Space>
      ) : (
        <Typography.Text type="secondary">-</Typography.Text>
      );
    case 'select':
      if (field.dependsOn) {
        const relatedItem = (dataStore[field.dependsOn] || []).find((dep: BaseEntity) => dep.id === value);
        return relatedItem ? <Tag>{relatedItem.businessKey}</Tag> : <Typography.Text type="secondary">None</Typography.Text>;
      }
      if (field.options) {
        const option = field.options.find(opt => opt.value === value);
        return option ? option.label : value;
      }
      return value;
    case 'textarea':
      return (
        <Tooltip title={String(value)}>
          <span>{String(value).length > 50 ? `${String(value).substring(0, 50)}...` : String(value)}</span>
        </Tooltip>
      );
    case 'date':
      return dayjs(value).isValid() ? dayjs(value).format('YYYY-MM-DD') : String(value);
    case 'number':
      return Number(value).toLocaleString();
    case 'url':
      return (
        <a href={value} target="_blank" rel="noopener noreferrer">
          {String(value).length > 30 ? `${String(value).substring(0, 30)}...` : value}
        </a>
      );
    case 'email':
      return <a href={`mailto:${value}`}>{value}</a>;
      case 'phone':
        return <a href={`tel:${value}`}>{value}</a>;
    default:
      return String(value);
  }
};

const buildColumns = (config: TableConfig): ColumnsType<BaseEntity> => {
  const displayFields = getTableFields(config);

  return [
    {
      title: 'Business Key',
      dataIndex: 'businessKey',
      key: 'businessKey',
      render: (value: string) => <Tag color="blue">{value}</Tag>,
      sorter: (a, b) => a.businessKey.localeCompare(b.businessKey),
    },
    ...displayFields.map(field => ({
      title: field.label,
      dataIndex: field.name,
      key: field.name,
      render: (_: any, record: BaseEntity) => renderFieldValue(record, field),
    })),
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (value: string) => dayjs(value).format('YYYY-MM-DD'),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_: any, record: BaseEntity) => (
        <Space>
          <Tooltip title="Edit">
            <Button type="link" icon={<EditOutlined />} onClick={() => editItem(record)} />
          </Tooltip>
          {config.display?.allowDuplicate !== false && (
            <Tooltip title="Duplicate">
              <Button type="link" icon={<CopyOutlined />} onClick={() => duplicateItem(record)} />
            </Tooltip>
          )}
          {config.display?.allowDelete !== false && (
            <Tooltip title="Delete">
              <Button type="link" danger icon={<DeleteOutlined />} onClick={() => deleteItem(record.id)} />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];
};

const handleAddCondition = () => {
  if (newCondition.field && newCondition.operator && newCondition.value !== undefined && newCondition.value !== '') {
    addFilterCondition(newCondition as FilterCondition);
    setNewCondition({ operator: 'equals' });
    setShowAdvancedFilters(false);
  }
};

const renderFilterValueInput = (field?: { name: string; label: string; type: string; options?: { value: string; label: string }[]; dependsOn?: string }) => {
  if (!field || !newCondition.operator) {
    return null;
  }

  if (newCondition.operator === 'between' && field.type === 'number') {
    const currentValue = typeof newCondition.value === 'object' && newCondition.value && 'start' in newCondition.value
      ? newCondition.value
      : { start: undefined, end: undefined };

    return (
      <Space style={{ width: '100%' }}>
        <InputNumber
          style={{ width: '45%' }}
          value={currentValue.start as number | undefined}
          onChange={(value) => setNewCondition({
            ...newCondition,
            value: { ...currentValue, start: value ?? undefined },
          })}
        />
        <InputNumber
          style={{ width: '45%' }}
          value={currentValue.end as number | undefined}
          onChange={(value) => setNewCondition({
            ...newCondition,
            value: { ...currentValue, end: value ?? undefined },
          })}
        />
      </Space>
    );
  }

  if (newCondition.operator === 'dateBetween' && field.type === 'date') {
    const currentValue = typeof newCondition.value === 'object' && newCondition.value && 'start' in newCondition.value
      ? newCondition.value
      : { start: undefined, end: undefined };

    return (
      <DatePicker.RangePicker
        style={{ width: '100%' }}
        value={[
          currentValue.start ? dayjs(currentValue.start as string) : null,
          currentValue.end ? dayjs(currentValue.end as string) : null,
        ] as any}
        onChange={(_, dateStrings) =>
          setNewCondition({
            ...newCondition,
            value: { start: dateStrings[0], end: dateStrings[1] },
          })
        }
      />
    );
  }

  if (field.type === 'date') {
    return (
      <DatePicker
        style={{ width: '100%' }}
        value={typeof newCondition.value === 'string' && newCondition.value ? dayjs(newCondition.value) : undefined}
        onChange={(_, dateString) => setNewCondition({ ...newCondition, value: dateString })}
      />
    );
  }

  if (field.type === 'number') {
    return (
      <InputNumber
        style={{ width: '100%' }}
        value={typeof newCondition.value === 'number' ? newCondition.value : newCondition.value ? Number(newCondition.value) : undefined}
        onChange={(value) => setNewCondition({ ...newCondition, value: value ?? '' })}
      />
    );
  }

  if (field.type === 'select' || field.type === 'boolean') {
    const options = field.type === 'boolean'
      ? [
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ]
      : getSelectOptions(field as FieldConfig);

    if (newCondition.operator === 'in') {
      return (
        <Select
          mode="multiple"
          allowClear
          style={{ width: '100%' }}
          value={Array.isArray(newCondition.value) ? newCondition.value : []}
          options={options}
          onChange={(value) => setNewCondition({ ...newCondition, value })}
        />
      );
    }

    return (
      <Select
        allowClear
        style={{ width: '100%' }}
        value={typeof newCondition.value === 'string' ? newCondition.value : undefined}
        options={options}
        onChange={(value) => setNewCondition({ ...newCondition, value })}
      />
    );
  }

  return (
    <Input
      value={typeof newCondition.value === 'string' ? newCondition.value : ''}
      onChange={(e) => setNewCondition({ ...newCondition, value: e.target.value })}
      placeholder="Enter value"
    />
  );
};

const renderAdvancedFilterContent = () => {
  const selectedField = getFilterableFields().find(f => f.name === newCondition.field);

  return (
    <div style={{ width: 360 }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Typography.Text strong>Advanced Filters</Typography.Text>
          <Button type="text" size="small" icon={<CloseOutlined />} onClick={() => setShowAdvancedFilters(false)} />
        </Space>

        {activeFilters.length > 0 && (
          <>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <Typography.Text type="secondary">Active Filters</Typography.Text>
              <Space size={[4, 4]} wrap>
                {activeFilters.map((condition, index) => {
                  const field = getFilterableFields().find(f => f.name === condition.field);
                  const valueLabel = typeof condition.value === 'object' && condition.value && 'start' in condition.value
                    ? `${condition.value.start || ''} - ${condition.value.end || ''}`
                    : Array.isArray(condition.value)
                      ? condition.value.join(', ')
                      : String(condition.value);

                  return (
                    <Tag key={`${condition.field}-${index}`} closable onClose={() => removeFilterCondition(index)}>
                      <strong>{field?.label}:</strong> {condition.operator} {valueLabel}
                    </Tag>
                  );
                })}
              </Space>
            </Space>
            <Divider style={{ margin: '8px 0' }} />
          </>
        )}

        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Typography.Text>Field</Typography.Text>
            <Select
              style={{ width: '100%', marginTop: 4 }}
              placeholder="Select field"
              value={newCondition.field}
              onChange={(value) => setNewCondition({ field: value, operator: 'equals', value: '' })}
              options={getFilterableFields().map(field => ({ label: field.label, value: field.name }))}
            />
          </div>

          {newCondition.field && (
            <div>
              <Typography.Text>Operator</Typography.Text>
              <Select
                style={{ width: '100%', marginTop: 4 }}
                value={newCondition.operator || 'equals'}
                onChange={(value) => setNewCondition({ ...newCondition, operator: value as FilterCondition['operator'], value: '' })}
                options={getFilterOperators(selectedField?.type || 'text').map(op => ({ label: op.label, value: op.value }))}
              />
            </div>
          )}

          {newCondition.field && newCondition.operator && (
            <div>
              <Typography.Text>Value</Typography.Text>
              <div style={{ marginTop: 4 }}>{renderFilterValueInput(selectedField)}</div>
            </div>
          )}

          <Button
            type="primary"
            icon={<FilterOutlined />}
            block
            disabled={!newCondition.field || !newCondition.operator || newCondition.value === '' || newCondition.value === undefined}
            onClick={handleAddCondition}
          >
            Add Filter
          </Button>

          {hasActiveFilters && (
            <Button block onClick={clearFilters}>
              Clear All Filters
            </Button>
          )}
        </Space>
      </Space>
    </div>
  );
};

const tabItems: TabsProps['items'] = tableConfigs.map((config) => {
  const configFilters = filters[config.id] || [];
  const isActive = config.id === activeTable;
  const configHasActiveFilters = (isActive && Boolean(searchTerm)) || configFilters.length > 0;
  const configFilteredItems = isActive ? filteredItems : (dataStore[config.id] || []);
  const columns = buildColumns(config);

  return {
    key: config.id,
    label: (
      <Space size={8}>
        {config.icon}
        <span>{config.name}</span>
        <Tag color="blue">{(dataStore[config.id] || []).length}</Tag>
      </Space>
    ),
    children: (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Row gutter={[16, 16]} justify="space-between" align="middle">
          <Col xs={24} md={16}>
            <Space wrap>
              <Input
                allowClear
                style={{ width: 260 }}
                placeholder={`Search ${config.name.toLowerCase()}...`}
                prefix={<SearchOutlined />}
                value={isActive ? searchTerm : ''}
                onChange={(e) => isActive && setSearchTerm(e.target.value)}
              />
              <Popover
                trigger="click"
                open={isActive ? showAdvancedFilters : false}
                onOpenChange={(open) => isActive && setShowAdvancedFilters(open)}
                content={renderAdvancedFilterContent()}
              >
                <Button type={configHasActiveFilters ? 'primary' : 'default'} icon={<FilterOutlined />}>
                  Filters
                  {configFilters.length > 0 && <Tag color="blue" style={{ marginLeft: 8 }}>{configFilters.length}</Tag>}
                </Button>
              </Popover>
              {isActive && hasActiveFilters && (
                <Button icon={<CloseOutlined />} onClick={clearFilters}>
                  Clear
                </Button>
              )}
            </Space>
          </Col>
          <Col xs={24} md="auto">
            <Space size={8} wrap>
              {config.dependencies.length > 0 && (
                <Space size={4} wrap>
                  <Typography.Text type="secondary">Depends on:</Typography.Text>
                  {config.dependencies.map(dep => (
                    <Tag key={dep}>{tableConfigs.find(t => t.id === dep)?.name}</Tag>
                  ))}
                </Space>
              )}
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => createNewItem(config.id)}
                disabled={config.dependencies.some(dep => !(dataStore[dep] && dataStore[dep].length > 0))}
              >
                Add {config.name.slice(0, -1)}
              </Button>
            </Space>
          </Col>
        </Row>

        {isActive && hasActiveFilters && (
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Typography.Text>Active filters:</Typography.Text>
            <Space size={[4, 4]} wrap>
              {searchTerm && (
                <Tag
                  closable
                  onClose={() => setSearchTerm('')}
                  icon={<SearchOutlined />}
                >
                  {searchTerm}
                </Tag>
              )}
              {activeFilters.map((condition, index) => {
                const field = getFilterableFields().find(f => f.name === condition.field);
                const valueLabel = typeof condition.value === 'object' && condition.value && 'start' in condition.value
                  ? `${condition.value.start || ''}-${condition.value.end || ''}`
                  : Array.isArray(condition.value)
                    ? condition.value.join(', ')
                    : String(condition.value);

                return (
                  <Tag key={`${condition.field}-${index}`} closable onClose={() => removeFilterCondition(index)}>
                    <strong>{field?.label}:</strong> {condition.operator} {valueLabel}
                  </Tag>
                );
              })}
            </Space>
          </Space>
        )}

        {config.dependencies.some(dep => !(dataStore[dep] && dataStore[dep].length > 0)) && (
          <Alert
            type="warning"
            message="Dependencies required"
            description={`Create ${config.dependencies
              .filter(dep => !(dataStore[dep] && dataStore[dep].length > 0))
              .map(dep => tableConfigs.find(t => t.id === dep)?.name)
              .join(', ')} before adding ${config.name.toLowerCase()}.`}
            showIcon
          />
        )}

          <Table
            columns={columns}
            dataSource={configFilteredItems.map(item => ({ ...item, key: item.id }))}
            pagination={{ pageSize: config.display?.pageSize || 10 }}
          locale={{
            emptyText: (
              <Space direction="vertical" align="center">
                {React.cloneElement(config.icon, { size: 32, color: '#999' })}
                <Typography.Text type="secondary">No {config.name.toLowerCase()} found.</Typography.Text>
              </Space>
            ),
          }}
          scroll={{ x: true }}
        />
      </Space>
    ),
  };
});

return (
  <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
        <Space direction="vertical" size={0}>
          <Space size={8}>
            <DatabaseOutlined style={{ fontSize: 24 }} />
            <Typography.Title level={3} style={{ margin: 0 }}>
              Enhanced Data Entry System
            </Typography.Title>
          </Space>
          <Typography.Text type="secondary">
            Manage relational data with business keys, editing, and flexible relationships
          </Typography.Text>
        </Space>
        <Button
          icon={<ExportOutlined />}
          onClick={() => {
            console.log('Full Dataset:', dataStore);
            toast.success('Data exported to console');
          }}
        >
          Export Data
        </Button>
      </Space>

      <Tabs
        activeKey={activeTable}
        onChange={setActiveTable}
        items={tabItems}
        destroyInactiveTabPane
      />
    </Space>

    <Modal
      open={showEditDialog}
      title={`${editingItem && (dataStore[activeTable] || []).some((item: BaseEntity) => item.id === editingItem.id) ? 'Edit' : 'Create'} ${currentConfig.name.slice(0, -1)}`}
      onCancel={() => setShowEditDialog(false)}
      onOk={saveItem}
      okText="Save"
      cancelText="Cancel"
      width={720}
      destroyOnClose
    >
      {editingItem && (
        <Form layout="vertical">
          <Form.Item label="Business Key">
            <Input
              value={editingItem.businessKey}
              onChange={(e) => setEditingItem({ ...editingItem, businessKey: e.target.value })}
              disabled={(dataStore[activeTable] || []).some((item: BaseEntity) => item.id === editingItem.id)}
              placeholder={`${currentConfig.businessKeyPrefix}-XXXX`}
            />
          </Form.Item>

          <Row gutter={16}>
            {currentConfig.fields.map((field) => (
              <Col key={field.name} span={field.type === 'textarea' ? 24 : 12}>
                <Form.Item
                  label={
                    <span>
                      {field.label}
                      {field.required && <span style={{ color: '#ff4d4f' }}> *</span>}
                    </span>
                  }
                >
                  {(() => {
                    if (!editingItem) return null;
                    const value = editingItem[field.name];

                      if (field.type === 'select') {
                        const options = getSelectOptions(field, editingItem.companyId);
                        const selectOptions = field.name === 'departmentId'
                          ? [{ label: 'No Department', value: '' }, ...options]
                          : options;
                        const selectedValue = field.name === 'departmentId'
                          ? (value ?? '')
                          : (value ?? undefined);

                        return (
                          <Select
                            allowClear={!field.required}
                            options={selectOptions}
                            value={selectedValue}
                            onChange={(val) => {
                              const finalValue = field.name === 'departmentId' ? (val ?? '') : val;
                              setEditingItem({ ...editingItem, [field.name]: finalValue });
                            }}
                            placeholder={field.placeholder}
                          />
                        );
                      }

                    if (field.type === 'multiselect') {
                      return (
                        <Select
                          mode="multiple"
                          allowClear
                          options={getSelectOptions(field, editingItem.companyId)}
                          value={Array.isArray(value) ? value : []}
                          onChange={(vals) => setEditingItem({ ...editingItem, [field.name]: vals })}
                          placeholder={field.placeholder}
                        />
                      );
                    }

                    if (field.type === 'boolean') {
                      return (
                        <Switch
                          checked={Boolean(value)}
                          onChange={(checked) => setEditingItem({ ...editingItem, [field.name]: checked })}
                        />
                      );
                    }

                    if (field.type === 'textarea') {
                      return (
                        <Input.TextArea
                          rows={3}
                          value={value || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, [field.name]: e.target.value })}
                          placeholder={field.placeholder}
                        />
                      );
                    }

                    if (field.type === 'number') {
                      return (
                        <InputNumber
                          style={{ width: '100%' }}
                          value={typeof value === 'number' ? value : value ? Number(value) : 0}
                          onChange={(val) => setEditingItem({ ...editingItem, [field.name]: val ?? 0 })}
                          placeholder={field.placeholder}
                        />
                      );
                    }

                    if (field.type === 'date') {
                      return (
                        <DatePicker
                          style={{ width: '100%' }}
                          value={value ? dayjs(value) : undefined}
                          onChange={(_, dateString) => setEditingItem({ ...editingItem, [field.name]: dateString })}
                        />
                      );
                    }

                    return (
                      <Input
                        type={field.type === 'phone' ? 'tel' : field.type === 'url' ? 'url' : field.type === 'email' ? 'email' : 'text'}
                        value={value || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, [field.name]: e.target.value })}
                        placeholder={field.placeholder}
                      />
                    );
                  })()}
                </Form.Item>
              </Col>
            ))}
          </Row>
        </Form>
      )}
    </Modal>
  </div>
  );
}

// Export default props for easy usage
export default function DataEntrySystemWithDefaults() {
  return <EnhancedDataEntrySystem />;
}
