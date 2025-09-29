import React, { useState } from 'react';
import { Layout, Card, Row, Col, Typography, Breadcrumb, Button, Tag, Badge, Space, Statistic } from 'antd';
import {
  ArrowLeftOutlined,
  BankOutlined,
  TeamOutlined,
  ProjectOutlined,
  UserSwitchOutlined,
  SettingOutlined,
  DatabaseOutlined,
  BarChartOutlined,
  LineChartOutlined,
  ApartmentOutlined,
  UserOutlined,
  GlobalOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  FundProjectionScreenOutlined,
  ContactsOutlined,
  TableOutlined,
  ExportOutlined,
  DashboardOutlined,
  FundOutlined
} from '@ant-design/icons';
import { Domain, Subdomain, Page, NavigationState, appConfig, TableConfig, defaultInitialData } from '../config/app-config';
import { EnhancedDataEntrySystem } from './EnhancedDataEntrySystem';

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

// Icon mapping for Ant Design icons
const iconMap: { [key: string]: React.ReactNode } = {
  BankOutlined: <BankOutlined />,
  TeamOutlined: <TeamOutlined />,
  ProjectOutlined: <ProjectOutlined />,
  UserSwitchOutlined: <UserSwitchOutlined />,
  SettingOutlined: <SettingOutlined />,
  DatabaseOutlined: <DatabaseOutlined />,
  BarChartOutlined: <BarChartOutlined />,
  LineChartOutlined: <LineChartOutlined />,
  ApartmentOutlined: <ApartmentOutlined />,
  UserOutlined: <UserOutlined />,
  GlobalOutlined: <GlobalOutlined />,
  CalendarOutlined: <CalendarOutlined />,
  CheckSquareOutlined: <CheckSquareOutlined />,
  FundProjectionScreenOutlined: <FundProjectionScreenOutlined />,
  ContactsOutlined: <ContactsOutlined />,
  TableOutlined: <TableOutlined />,
  ExportOutlined: <ExportOutlined />,
  DashboardOutlined: <DashboardOutlined />,
  FundOutlined: <FundOutlined />
};

export function NavigationShell() {
  const [navigationState, setNavigationState] = useState<NavigationState>({});
  const [currentPage, setCurrentPage] = useState<Page | null>(null);

  const getIcon = (iconName?: string) => {
    if (!iconName) return null;
    return iconMap[iconName] || null;
  };

  const handleDomainSelect = (domain: Domain) => {
    setNavigationState({ selectedDomain: domain });
    setCurrentPage(null);
  };

  const handleSubdomainSelect = (subdomain: Subdomain) => {
    setNavigationState(prev => ({ ...prev, selectedSubdomain: subdomain }));
    setCurrentPage(null);
  };

  const handlePageSelect = (page: Page) => {
    const newState = { ...navigationState, selectedPage: page };
    setNavigationState(newState);
    setCurrentPage(page);
  };

  const handleBack = () => {
    if (currentPage) {
      setCurrentPage(null);
      setNavigationState(prev => ({ ...prev, selectedPage: undefined }));
    } else if (navigationState.selectedSubdomain) {
      setNavigationState(prev => ({
        selectedDomain: prev.selectedDomain,
        selectedSubdomain: undefined,
        selectedPage: undefined
      }));
    } else if (navigationState.selectedDomain) {
      setNavigationState({});
    }
  };

  const renderBreadcrumb = () => {
    const items = [
      {
        title: <a onClick={() => setNavigationState({})}>Home</a>
      }
    ];

    if (navigationState.selectedDomain) {
      items.push({
        title: navigationState.selectedSubdomain ?
          <a onClick={() => setNavigationState({ selectedDomain: navigationState.selectedDomain })}>
            <Space>
              {getIcon(navigationState.selectedDomain.icon)}
              {navigationState.selectedDomain.name}
            </Space>
          </a> :
          <Space>
            {getIcon(navigationState.selectedDomain.icon)}
            {navigationState.selectedDomain.name}
          </Space>
      });
    }

    if (navigationState.selectedSubdomain) {
      items.push({
        title: currentPage ?
          <a onClick={() => { setCurrentPage(null); setNavigationState(prev => ({ ...prev, selectedPage: undefined })); }}>
            <Space>
              {getIcon(navigationState.selectedSubdomain.icon)}
              {navigationState.selectedSubdomain.name}
            </Space>
          </a> :
          <Space>
            {getIcon(navigationState.selectedSubdomain.icon)}
            {navigationState.selectedSubdomain.name}
          </Space>
      });
    }

    if (currentPage) {
      items.push({
        title: <Space>
          {getIcon(currentPage.icon)}
          {currentPage.name}
        </Space>
      });
    }

    return items.length > 1 ? <Breadcrumb items={items} className="mb-6" /> : null;
  };

  // Render page content
  if (currentPage) {
    if (currentPage.component === 'EnhancedDataEntrySystem' && currentPage.tableConfigs) {
      const tableConfigs = currentPage.tableConfigs;

      return (
        <Layout className="min-h-screen bg-gray-50">
          <Content className="p-6">
            {renderBreadcrumb()}
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
              className="mb-4"
            >
              Back
            </Button>
            <EnhancedDataEntrySystem
              tableConfigs={tableConfigs}
              initialData={defaultInitialData}
            />
          </Content>
        </Layout>
      );
    }

    // Placeholder for other components
    return (
      <Layout className="min-h-screen bg-gray-50">
        <Content className="p-6">
          {renderBreadcrumb()}
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            className="mb-4"
          >
            Back
          </Button>
          <Card>
            <Title level={3}>{currentPage.name}</Title>
            <Paragraph>{currentPage.description}</Paragraph>
            <Tag color={currentPage.type === 'transactional' ? 'green' : 'blue'}>
              {currentPage.type}
            </Tag>
            <Paragraph className="mt-4">
              Component: {currentPage.component} (Coming soon)
            </Paragraph>
          </Card>
        </Content>
      </Layout>
    );
  }

  // Show domains
  if (!navigationState.selectedDomain) {
    return (
      <Layout className="min-h-screen bg-gray-50">
        <Content className="p-6">
          <div className="mb-8">
            <Title level={2}>Business Application Suite</Title>
            <Paragraph className="text-gray-600">
              Select a domain to access related business functions and data management tools.
            </Paragraph>
          </div>

          <Row gutter={[24, 24]}>
            {appConfig.domains.map((domain) => {
              const totalPages = domain.subdomains.reduce((total, sub) => total + sub.pages.length, 0);
              const transactionalPages = domain.subdomains.reduce(
                (total, sub) => total + sub.pages.filter(p => p.type === 'transactional').length, 0
              );
              const referencePages = totalPages - transactionalPages;

              return (
                <Col xs={24} sm={12} lg={8} key={domain.id}>
                  <Card
                    hoverable
                    onClick={() => handleDomainSelect(domain)}
                    className="h-full transition-all hover:shadow-lg"
                    style={{ borderTop: `3px solid ${domain.color || '#1890ff'}` }}
                  >
                    <Space direction="vertical" className="w-full">
                      <Space>
                        <span style={{ fontSize: 24, color: domain.color || '#1890ff' }}>
                          {getIcon(domain.icon)}
                        </span>
                        <Title level={4} className="mb-0">{domain.name}</Title>
                      </Space>

                      <Paragraph className="text-gray-600 mb-4">
                        {domain.description}
                      </Paragraph>

                      <Row gutter={16}>
                        <Col span={8}>
                          <Statistic
                            title="Subdomains"
                            value={domain.subdomains.length}
                            valueStyle={{ fontSize: 20 }}
                          />
                        </Col>
                        <Col span={8}>
                          <Statistic
                            title="Pages"
                            value={totalPages}
                            valueStyle={{ fontSize: 20 }}
                          />
                        </Col>
                        <Col span={8}>
                          <Space direction="vertical" size={0}>
                            <Text type="secondary" style={{ fontSize: 12 }}>Types</Text>
                            <Space size={4}>
                              <Badge count={transactionalPages} style={{ backgroundColor: '#52c41a' }} />
                              <Badge count={referencePages} style={{ backgroundColor: '#1890ff' }} />
                            </Space>
                          </Space>
                        </Col>
                      </Row>
                    </Space>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Content>
      </Layout>
    );
  }

  // Show subdomains
  if (!navigationState.selectedSubdomain) {
    return (
      <Layout className="min-h-screen bg-gray-50">
        <Content className="p-6">
          {renderBreadcrumb()}

          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            className="mb-6"
          >
            Back to Domains
          </Button>

          <div className="mb-6">
            <Space>
              <span style={{ fontSize: 28, color: navigationState.selectedDomain.color || '#1890ff' }}>
                {getIcon(navigationState.selectedDomain.icon)}
              </span>
              <Title level={2} className="mb-0">{navigationState.selectedDomain.name}</Title>
            </Space>
            {navigationState.selectedDomain.description && (
              <Paragraph className="text-gray-600 mt-2">
                {navigationState.selectedDomain.description}
              </Paragraph>
            )}
          </div>

          <Row gutter={[24, 24]}>
            {navigationState.selectedDomain.subdomains.map((subdomain) => {
              const transactionalCount = subdomain.pages.filter(p => p.type === 'transactional').length;
              const referenceCount = subdomain.pages.filter(p => p.type === 'reference').length;

              return (
                <Col xs={24} sm={12} key={subdomain.id}>
                  <Card
                    hoverable
                    onClick={() => handleSubdomainSelect(subdomain)}
                    className="h-full transition-all hover:shadow-lg"
                  >
                    <Space direction="vertical" className="w-full">
                      <Space>
                        <span style={{ fontSize: 20 }}>
                          {getIcon(subdomain.icon)}
                        </span>
                        <Title level={4} className="mb-0">{subdomain.name}</Title>
                      </Space>

                      {subdomain.description && (
                        <Paragraph className="text-gray-600">
                          {subdomain.description}
                        </Paragraph>
                      )}

                      <Space className="mt-2">
                        <Text type="secondary">{subdomain.pages.length} pages</Text>
                        {transactionalCount > 0 && (
                          <Tag color="green">{transactionalCount} transactional</Tag>
                        )}
                        {referenceCount > 0 && (
                          <Tag color="blue">{referenceCount} reference</Tag>
                        )}
                      </Space>
                    </Space>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Content>
      </Layout>
    );
  }

  // Show pages
  return (
    <Layout className="min-h-screen bg-gray-50">
      <Content className="p-6">
        {renderBreadcrumb()}

        <Button
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          className="mb-6"
        >
          Back to Subdomains
        </Button>

        <div className="mb-6">
          <Space>
            <span style={{ fontSize: 24 }}>
              {getIcon(navigationState.selectedSubdomain.icon)}
            </span>
            <Title level={2} className="mb-0">{navigationState.selectedSubdomain.name}</Title>
          </Space>
          {navigationState.selectedSubdomain.description && (
            <Paragraph className="text-gray-600 mt-2">
              {navigationState.selectedSubdomain.description}
            </Paragraph>
          )}
        </div>

        <Row gutter={[24, 24]}>
          {navigationState.selectedSubdomain.pages.map((page) => (
            <Col xs={24} sm={12} lg={8} key={page.id}>
              <Card
                hoverable
                onClick={() => handlePageSelect(page)}
                className="h-full transition-all hover:shadow-lg"
              >
                <Space direction="vertical" className="w-full">
                  <Space className="w-full justify-between">
                    <Space>
                      {getIcon(page.icon)}
                      <Title level={5} className="mb-0">{page.name}</Title>
                    </Space>
                    <Tag color={page.type === 'transactional' ? 'green' : 'blue'}>
                      {page.type}
                    </Tag>
                  </Space>

                  {page.description && (
                    <Paragraph className="text-gray-600 mb-0">
                      {page.description}
                    </Paragraph>
                  )}
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Content>
    </Layout>
  );
}


###config app-config.ts
import React from 'react';
import { Building, Users, FolderOpen, CheckSquare } from 'lucide-react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type PageType = 'reference' | 'transactional';
export type FieldType = 'text' | 'email' | 'number' | 'date' | 'textarea' | 'select' | 'multiselect' | 'boolean' | 'phone' | 'url';

export interface BaseEntity {
  id: string;
  businessKey: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export interface DataStore {
  [tableName: string]: BaseEntity[];
}

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  dependsOn?: string;
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

export interface TableConfig {
  id: string;
  name: string;
  icon: React.ReactNode;
  businessKeyPrefix: string;
  dependencies: string[];
  fields: FieldConfig[];
  display?: {
    defaultView?: 'table' | 'cards' | 'list';
    allowExport?: boolean;
    showBusinessKey?: boolean;
    pageSize?: number;
  };
}

export interface Page {
  id: string;
  name: string;
  description?: string;
  type: PageType;
  component: string;
  icon?: string;
  tableConfigs?: TableConfig[];  // Changed to support multiple tables
}

export interface Subdomain {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  pages: Page[];
}

export interface Domain {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  subdomains: Subdomain[];
}

export interface AppConfig {
  domains: Domain[];
}

export interface NavigationState {
  selectedDomain?: Domain;
  selectedSubdomain?: Subdomain;
  selectedPage?: Page;
}

// ============================================================================
// TABLE CONFIGURATIONS WITH INITIAL DATA
// ============================================================================

const companiesTableConfig: TableConfig = {
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
      placeholder: '+1 (555) 000-0000',
      display: { showInTable: true, tableOrder: 4 }
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'contact@company.com',
      display: { showInTable: true, tableOrder: 5 }
    },
    {
      name: 'founded',
      label: 'Founded Year',
      type: 'number',
      placeholder: '2000',
      validation: {
        min: 1800,
        max: new Date().getFullYear()
      },
      display: { showInTable: false }
    },
    {
      name: 'active',
      label: 'Active',
      type: 'boolean',
      display: { showInTable: true, tableOrder: 6 }
    }
  ],
  display: {
    defaultView: 'table',
    allowExport: true,
    showBusinessKey: true,
    pageSize: 10
  }
};

const departmentsTableConfig: TableConfig = {
  id: 'departments',
  name: 'Departments',
  icon: <FolderOpen size={18} />,
  businessKeyPrefix: 'DEPT',
  dependencies: ['companies'],
  fields: [
    {
      name: 'name',
      label: 'Department Name',
      type: 'text',
      required: true,
      placeholder: 'Enter department name',
      display: { showInTable: true, tableOrder: 1 }
    },
    {
      name: 'companyId',
      label: 'Company',
      type: 'select',
      required: true,
      dependsOn: 'companies',
      placeholder: 'Select company',
      display: { showInTable: true, tableOrder: 2 }
    },
    {
      name: 'manager',
      label: 'Manager Name',
      type: 'text',
      placeholder: 'Enter manager name',
      display: { showInTable: true, tableOrder: 3 }
    },
    {
      name: 'budget',
      label: 'Budget',
      type: 'number',
      placeholder: '0',
      validation: { min: 0 },
      display: { showInTable: true, tableOrder: 4 }
    },
    {
      name: 'headcount',
      label: 'Headcount',
      type: 'number',
      placeholder: '0',
      validation: { min: 0 },
      display: { showInTable: true, tableOrder: 5 }
    },
    {
      name: 'location',
      label: 'Location',
      type: 'text',
      placeholder: 'Enter location',
      display: { showInTable: false }
    },
    {
      name: 'costCenter',
      label: 'Cost Center',
      type: 'text',
      placeholder: 'Enter cost center code',
      display: { showInTable: false }
    }
  ],
  display: {
    defaultView: 'table',
    allowExport: true,
    showBusinessKey: true,
    pageSize: 10
  }
};

const employeesTableConfig: TableConfig = {
  id: 'employees',
  name: 'Employees',
  icon: <Users size={18} />,
  businessKeyPrefix: 'EMP',
  dependencies: ['companies', 'departments'],
  fields: [
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
      placeholder: 'employee@company.com',
      display: { showInTable: true, tableOrder: 3 }
    },
    {
      name: 'companyId',
      label: 'Company',
      type: 'select',
      required: true,
      dependsOn: 'companies',
      placeholder: 'Select company',
      display: { showInTable: true, tableOrder: 4 }
    },
    {
      name: 'departmentId',
      label: 'Department',
      type: 'select',
      required: true,
      dependsOn: 'departments',
      placeholder: 'Select department',
      display: { showInTable: true, tableOrder: 5 }
    },
    {
      name: 'position',
      label: 'Position',
      type: 'text',
      placeholder: 'Enter job title',
      display: { showInTable: true, tableOrder: 6 }
    },
    {
      name: 'employmentType',
      label: 'Employment Type',
      type: 'select',
      options: [
        { value: 'Full-time', label: 'Full-time' },
        { value: 'Part-time', label: 'Part-time' },
        { value: 'Contract', label: 'Contract' },
        { value: 'Intern', label: 'Intern' }
      ],
      placeholder: 'Select employment type',
      display: { showInTable: false }
    },
    {
      name: 'startDate',
      label: 'Start Date',
      type: 'date',
      display: { showInTable: false }
    },
    {
      name: 'phone',
      label: 'Phone',
      type: 'phone',
      placeholder: '+1 (555) 000-0000',
      display: { showInTable: false }
    },
    {
      name: 'active',
      label: 'Active',
      type: 'boolean',
      display: { showInTable: true, tableOrder: 7 }
    }
  ],
  display: {
    defaultView: 'table',
    allowExport: true,
    showBusinessKey: true,
    pageSize: 10
  }
};

const projectsTableConfig: TableConfig = {
  id: 'projects',
  name: 'Projects',
  icon: <FolderOpen size={18} />,
  businessKeyPrefix: 'PROJ',
  dependencies: ['departments'],
  fields: [
    {
      name: 'name',
      label: 'Project Name',
      type: 'text',
      required: true,
      placeholder: 'Enter project name',
      display: { showInTable: true, tableOrder: 1 }
    },
    {
      name: 'departmentId',
      label: 'Department',
      type: 'select',
      required: true,
      dependsOn: 'departments',
      placeholder: 'Select department',
      display: { showInTable: true, tableOrder: 2 }
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'Planning', label: 'Planning' },
        { value: 'In Progress', label: 'In Progress' },
        { value: 'On Hold', label: 'On Hold' },
        { value: 'Completed', label: 'Completed' },
        { value: 'Cancelled', label: 'Cancelled' }
      ],
      placeholder: 'Select status',
      display: { showInTable: true, tableOrder: 3 }
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
      placeholder: 'Select priority',
      display: { showInTable: true, tableOrder: 4 }
    },
    {
      name: 'startDate',
      label: 'Start Date',
      type: 'date',
      display: { showInTable: true, tableOrder: 5 }
    },
    {
      name: 'endDate',
      label: 'End Date',
      type: 'date',
      display: { showInTable: true, tableOrder: 6 }
    },
    {
      name: 'budget',
      label: 'Budget',
      type: 'number',
      placeholder: '0',
      validation: { min: 0 },
      display: { showInTable: false }
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Enter project description',
      display: { showInTable: false }
    }
  ],
  display: {
    defaultView: 'table',
    allowExport: true,
    showBusinessKey: true,
    pageSize: 10
  }
};

const tasksTableConfig: TableConfig = {
  id: 'tasks',
  name: 'Tasks',
  icon: <CheckSquare size={18} />,
  businessKeyPrefix: 'TASK',
  dependencies: ['projects', 'employees'],
  fields: [
    {
      name: 'title',
      label: 'Task Title',
      type: 'text',
      required: true,
      placeholder: 'Enter task title',
      display: { showInTable: true, tableOrder: 1 }
    },
    {
      name: 'projectId',
      label: 'Project',
      type: 'select',
      required: true,
      dependsOn: 'projects',
      placeholder: 'Select project',
      display: { showInTable: true, tableOrder: 2 }
    },
    {
      name: 'assignedTo',
      label: 'Assigned To',
      type: 'select',
      dependsOn: 'employees',
      placeholder: 'Select employee',
      display: { showInTable: true, tableOrder: 3 }
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'To Do', label: 'To Do' },
        { value: 'In Progress', label: 'In Progress' },
        { value: 'Review', label: 'Review' },
        { value: 'Done', label: 'Done' },
        { value: 'Blocked', label: 'Blocked' }
      ],
      placeholder: 'Select status',
      display: { showInTable: true, tableOrder: 4 }
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
      placeholder: 'Select priority',
      display: { showInTable: true, tableOrder: 5 }
    },
    {
      name: 'dueDate',
      label: 'Due Date',
      type: 'date',
      display: { showInTable: true, tableOrder: 6 }
    },
    {
      name: 'estimatedHours',
      label: 'Estimated Hours',
      type: 'number',
      placeholder: '0',
      validation: { min: 0 },
      display: { showInTable: false }
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Enter task description',
      display: { showInTable: false }
    },
    {
      name: 'completed',
      label: 'Completed',
      type: 'boolean',
      display: { showInTable: true, tableOrder: 7 }
    }
  ],
  display: {
    defaultView: 'table',
    allowExport: true,
    showBusinessKey: true,
    pageSize: 10
  }
};

// ============================================================================
// UNIFIED APPLICATION CONFIGURATION
// ============================================================================

export const appConfig: AppConfig = {
  domains: [
    {
      id: 'business-management',
      name: 'Business Management',
      description: 'Core business operations and data management',
      icon: 'BankOutlined',
      color: '#1890ff',
      subdomains: [
        {
          id: 'master-data',
          name: 'Master Data Management',
          description: 'Centralized data management across all entities',
          icon: 'DatabaseOutlined',
          pages: [
            {
              id: 'all-master-data',
              name: 'All Master Data',
              description: 'Manage all business entities in one place',
              type: 'transactional',
              component: 'EnhancedDataEntrySystem',
              icon: 'TableOutlined',
              tableConfigs: [
                companiesTableConfig,
                departmentsTableConfig,
                employeesTableConfig,
                projectsTableConfig,
                tasksTableConfig
              ]
            }
          ]
        },
        {
          id: 'organizational-data',
          name: 'Organizational Data',
          description: 'Company structure and employee information',
          icon: 'TeamOutlined',
          pages: [
            {
              id: 'company-management',
              name: 'Company Management',
              description: 'Manage company information and corporate structure',
              type: 'transactional',
              component: 'EnhancedDataEntrySystem',
              icon: 'BankOutlined',
              tableConfigs: [companiesTableConfig]
            },
            {
              id: 'department-management',
              name: 'Department Management',
              description: 'Manage organizational departments',
              type: 'transactional',
              component: 'EnhancedDataEntrySystem',
              icon: 'ApartmentOutlined',
              tableConfigs: [departmentsTableConfig]
            },
            {
              id: 'employee-directory',
              name: 'Employee Directory',
              description: 'Manage employee information',
              type: 'transactional',
              component: 'EnhancedDataEntrySystem',
              icon: 'UserOutlined',
              tableConfigs: [employeesTableConfig]
            },
            {
              id: 'complete-organization',
              name: 'Complete Organization',
              description: 'Manage all organizational data in one place',
              type: 'transactional',
              component: 'EnhancedDataEntrySystem',
              icon: 'GlobalOutlined',
              tableConfigs: [companiesTableConfig, departmentsTableConfig, employeesTableConfig]
            }
          ]
        },
        {
          id: 'project-management',
          name: 'Project Management',
          description: 'Project planning and task coordination',
          icon: 'ProjectOutlined',
          pages: [
            {
              id: 'project-planning',
              name: 'Project Planning',
              description: 'Create and manage projects',
              type: 'transactional',
              component: 'EnhancedDataEntrySystem',
              icon: 'CalendarOutlined',
              tableConfigs: [projectsTableConfig]
            },
            {
              id: 'task-management',
              name: 'Task Management',
              description: 'Assign and track project tasks',
              type: 'transactional',
              component: 'EnhancedDataEntrySystem',
              icon: 'CheckSquareOutlined',
              tableConfigs: [tasksTableConfig]
            },
            {
              id: 'project-task-overview',
              name: 'Projects & Tasks',
              description: 'Complete project and task management view',
              type: 'transactional',
              component: 'EnhancedDataEntrySystem',
              icon: 'FundProjectionScreenOutlined',
              tableConfigs: [projectsTableConfig, tasksTableConfig]
            }
          ]
        }
      ]
    },
    {
      id: 'analytics-reporting',
      name: 'Analytics & Reporting',
      description: 'Business intelligence and analytics',
      icon: 'BarChartOutlined',
      color: '#fa541c',
      subdomains: [
        {
          id: 'business-analytics',
          name: 'Business Analytics',
          description: 'Analyze business performance',
          icon: 'LineChartOutlined',
          pages: [
            {
              id: 'company-overview',
              name: 'Company Overview',
              description: 'View company statistics and trends',
              type: 'reference',
              component: 'CompanyDashboard',
              icon: 'DashboardOutlined'
            },
            {
              id: 'project-analytics',
              name: 'Project Analytics',
              description: 'Project performance metrics',
              type: 'reference',
              component: 'ProjectDashboard',
              icon: 'FundOutlined'
            }
          ]
        }
      ]
    }
  ]
};

// ============================================================================
// DEFAULT INITIAL DATA
// ============================================================================

export const defaultInitialData: DataStore = {
  companies: [
    {
      id: 'comp_1',
      businessKey: 'COMP-0001',
      name: 'Tech Solutions Inc',
      industry: 'Technology',
      website: 'https://techsolutions.com',
      address: '123 Tech Street, Silicon Valley, CA 94025',
      phone: '+1 (555) 123-4567',
      email: 'contact@techsolutions.com',
      founded: 2010,
      active: true,
      createdAt: new Date('2024-01-01').toISOString(),
      updatedAt: new Date('2024-01-01').toISOString()
    },
    {
      id: 'comp_2',
      businessKey: 'COMP-0002',
      name: 'Global Enterprises',
      industry: 'Finance',
      website: 'https://globalenterprises.com',
      address: '456 Business Ave, New York, NY 10001',
      phone: '+1 (555) 987-6543',
      email: 'info@globalenterprises.com',
      founded: 2005,
      active: true,
      createdAt: new Date('2024-01-02').toISOString(),
      updatedAt: new Date('2024-01-02').toISOString()
    }
  ],
  departments: [
    {
      id: 'dept_1',
      businessKey: 'DEPT-0001',
      name: 'Engineering',
      companyId: 'comp_1',
      manager: 'John Smith',
      budget: 500000,
      headcount: 25,
      location: 'Building A',
      costCenter: 'CC-100',
      createdAt: new Date('2024-01-03').toISOString(),
      updatedAt: new Date('2024-01-03').toISOString()
    },
    {
      id: 'dept_2',
      businessKey: 'DEPT-0002',
      name: 'Marketing',
      companyId: 'comp_1',
      manager: 'Jane Doe',
      budget: 200000,
      headcount: 10,
      location: 'Building B',
      costCenter: 'CC-200',
      createdAt: new Date('2024-01-03').toISOString(),
      updatedAt: new Date('2024-01-03').toISOString()
    }
  ],
  employees: [
    {
      id: 'emp_1',
      businessKey: 'EMP-0001',
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice.johnson@techsolutions.com',
      companyId: 'comp_1',
      departmentId: 'dept_1',
      position: 'Senior Developer',
      employmentType: 'Full-time',
      startDate: '2022-03-15',
      phone: '+1 (555) 111-2222',
      active: true,
      createdAt: new Date('2024-01-04').toISOString(),
      updatedAt: new Date('2024-01-04').toISOString()
    },
    {
      id: 'emp_2',
      businessKey: 'EMP-0002',
      firstName: 'Bob',
      lastName: 'Wilson',
      email: 'bob.wilson@techsolutions.com',
      companyId: 'comp_1',
      departmentId: 'dept_2',
      position: 'Marketing Manager',
      employmentType: 'Full-time',
      startDate: '2021-06-01',
      phone: '+1 (555) 333-4444',
      active: true,
      createdAt: new Date('2024-01-04').toISOString(),
      updatedAt: new Date('2024-01-04').toISOString()
    }
  ],
  projects: [
    {
      id: 'proj_1',
      businessKey: 'PROJ-0001',
      name: 'Website Redesign',
      departmentId: 'dept_2',
      status: 'In Progress',
      priority: 'High',
      startDate: '2024-01-15',
      endDate: '2024-06-30',
      budget: 50000,
      description: 'Complete redesign of company website',
      createdAt: new Date('2024-01-15').toISOString(),
      updatedAt: new Date('2024-01-15').toISOString()
    }
  ],
  tasks: [
    {
      id: 'task_1',
      businessKey: 'TASK-0001',
      title: 'Design new homepage',
      projectId: 'proj_1',
      assignedTo: 'emp_2',
      status: 'In Progress',
      priority: 'High',
      dueDate: '2024-02-15',
      estimatedHours: 40,
      description: 'Create mockups for the new homepage design',
      completed: false,
      createdAt: new Date('2024-01-20').toISOString(),
      updatedAt: new Date('2024-01-20').toISOString()
    }
  ]
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const getAllPages = (): Page[] => {
  return appConfig.domains.flatMap(domain =>
    domain.subdomains.flatMap(subdomain => subdomain.pages)
  );
};

export const getAllTableConfigs = (): TableConfig[] => {
  const configs: TableConfig[] = [];
  getAllPages().forEach(page => {
    if (page.tableConfigs) {
      configs.push(...page.tableConfigs);
    }
  });
  // Remove duplicates based on table id
  return configs.filter((config, index, self) =>
    index === self.findIndex(c => c.id === config.id)
  );
};

export const getTableConfigById = (tableId: string): TableConfig | undefined => {
  return getAllTableConfigs().find(config => config.id === tableId);
};

export const getPagesByType = (type: PageType): Page[] => {
  return getAllPages().filter(page => page.type === type);
};

export const findPageById = (pageId: string): Page | undefined => {
  return getAllPages().find(page => page.id === pageId);
};

export const buildNavigationPath = (domainId: string, subdomainId?: string, pageId?: string) => {
  const domain = appConfig.domains.find(d => d.id === domainId);
  if (!domain) return null;

  if (!subdomainId) return { domain };

  const subdomain = domain.subdomains.find(s => s.id === subdomainId);
  if (!subdomain) return { domain };

  if (!pageId) return { domain, subdomain };

  const page = subdomain.pages.find(p => p.id === pageId);
  if (!page) return { domain, subdomain };

  return { domain, subdomain, page };
};

export const getDomainStats = () => {
  return appConfig.domains.map(domain => ({
    domainId: domain.id,
    domainName: domain.name,
    subdomainCount: domain.subdomains.length,
    totalPages: domain.subdomains.reduce((total, sub) => total + sub.pages.length, 0),
    transactionalPages: domain.subdomains.reduce(
      (total, sub) => total + sub.pages.filter(p => p.type === 'transactional').length, 0
    ),
    referencePages: domain.subdomains.reduce(
      (total, sub) => total + sub.pages.filter(p => p.type === 'reference').length, 0
    )
  }));
};


####EnhancedDataEntrySystem.tsx
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
import { getAllTableConfigs, defaultInitialData, BaseEntity, DataStore, FieldConfig, TableConfig } from '../config/app-config';

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

// Types are now imported from app-config

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

// Export types that are still used elsewhere
export type { BaseEntity, DataStore, FieldConfig, TableConfig };

// Get default table configs from unified config
const defaultTableConfigs = getAllTableConfigs();

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
