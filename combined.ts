//types.ts
export interface RelationshipMeta {
  type: 'one' | 'many';
  parentKey?: string;
  parentTable?: string;
  childKey?: string;
  childTable?: string;
}

export interface TableMeta {
  businessKeys: string[];
  columns: string[];
  foreignKeys?: Record<string, string>;
  relationships?: Record<string, RelationshipMeta>;
}
export interface SchemaConfig {
  sequence: string[];
  tables: Record<string, TableMeta>;
}

export type Widget = "text" | "email" | "number" | "date" | "select";

export interface FieldSpec {
  column: string;
  widget: Widget;
  options?: string[];
}

export interface SectionSpec {
  title: string;
  fields?: FieldSpec[];
  nested?: NestedRepeatSpec;
  isBusinessKeySection?: boolean;
}

export interface NestedRepeatSpec {
  repeat: true;
  table: string;
  sections: SectionSpec[];
}

export interface ScreenSpec {
  id: string;
  table: string;
  title: string;
  sections: SectionSpec[];
}

export interface UiConfig {
  screens: ScreenSpec[];
}

export interface BusinessKeyOption {
  id: number;
  value: string;
}

//styles.css
/* Layout for form with sidebar */
.form-layout {
  display: flex;
  align-items: flex-start;
  gap: 24px;
}

/* Header used on completion screen */
.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.form-content {
  flex: 1;
}

.form-sidebar {
  width: 180px;
}

/* Navigation steps */
.steps {
  list-style: none;
  padding: 0;
  margin: 0 0 16px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.back-button {
  white-space: nowrap;
  margin-top: 8px;
}
.steps li {
  padding: 4px 8px;
  border-left: 3px solid #e1e1e1;
  cursor: default;
}
.steps li.done {
  color: #059669;
  border-color: #059669;
  font-weight: 600;
}
.steps li.done.editing {
  color: #f59e0b;
  border-color: #f59e0b;
  font-weight: 600;
}
.steps li.current {
  color: #2563eb;
  border-color: #2563eb;
  font-weight: 600;
}

/* Base styles */
body {
  font-family: system-ui, sans-serif;
  margin: 0;
  background: #f7f7f7;
}
main {
  max-width: 640px;
  margin: 0 auto;
  padding: 24px;
}
h2, h3, h4 {
  margin: 0 0 16px;
}

/* Section styles */
.section {
  background: #fff;
  border: 1px solid #e1e1e1;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.07);
  transition: opacity 0.3s ease;
}
.disabled-section {
  background: #fafafa;
  opacity: 0.85;
}
.completed-section {
  margin-bottom: 16px;
  border-left: 4px solid #059669;
}

/* Form field styles */
.field {
  margin-bottom: 16px;
}
.field label {
  display: block;
  margin-bottom: 4px;
  font-size: 14px;
  text-transform: capitalize;
  font-weight: 500;
}
input, select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font: inherit;
  box-sizing: border-box;
}

input[type="radio"] {
  width: auto;
}
input:disabled, select:disabled {
  background-color: #f5f5f5;
  color: #666;
  cursor: not-allowed;
}
.field-value {
  padding: 8px 0;
  color: #333;
}
.has-error input, .has-error select {
  border-color: #e11d48;
}
.error-message {
  color: #e11d48;
  font-size: 14px;
  margin: 4px 0 16px;
  padding: 8px;
  background: #fef2f2;
  border-radius: 4px;
  border-left: 3px solid #e11d48;
}

/* Button styles */
.btn {
  display: inline-block;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-primary {
  background: #2563eb;
  color: #fff;
}
.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
}
.btn-secondary {
  background: #059669;
  color: #fff;
}
.btn-secondary:hover:not(:disabled) {
  background: #047857;
}
.btn-small {
  padding: 4px 12px;
  font-size: .85rem;
}

/* Saved rows display */
.saved-rows {
  margin-bottom: 20px;
  border-top: 1px solid #e5e7eb;
  padding-top: 16px;
}
.saved-row {
  padding: 12px;
  background: #f8fafc;
  border-radius: 4px;
  margin-bottom: 8px;
  border-left: 3px solid #2563eb;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.saved-row .field-value {
  flex: 1;
  min-width: 180px;
}
.repeat-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

/* Business Key Selection */
.business-key-select {
  margin-bottom: 16px;
}
.business-key-select input,
.business-key-select select {
  width: 100%;
  margin-bottom: 8px;
}
.loading-indicator {
  display: inline-block;
  font-size: 12px;
  color: #2563eb;
  margin-left: 8px;
}

/* Generic table styling */
.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
}

.data-table th,
.data-table td {
  padding: 8px;
  border: 1px solid #e5e7eb;
  text-align: left;
}

.data-table th {
  background: #f8fafc;
}

/* App loading & error states */
.app-loading, .app-error {
  max-width: 640px;
  margin: 40px auto;
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}
.app-error h2 {
  color: #e11d48;
}

/* Site layout */
.site-header {
  background: #1f2937;
  color: white;
  padding: 16px;
  text-align: center;
  margin-bottom: 32px;
}

.app-container {
  max-width: 960px;
  margin: 0 auto;
}

/* Layout with left menu */
.app-menu-layout {
  display: flex;
  align-items: flex-start;
}

.left-menu {
  width: 180px;
  margin-right: 24px;
}

.left-menu ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.left-menu li {
  padding: 8px;
  cursor: pointer;
  border-left: 3px solid #e5e7eb;
}

.left-menu li.active {
  font-weight: 600;
  color: #2563eb;
  border-color: #2563eb;
}

.menu-content {
  flex: 1;
}

//src/components/DenormalizedTableView.tsx
import { useEffect, useMemo, useState } from 'react';
import RenderSection from './RenderSection';
import { SchemaConfig, UiConfig, SectionSpec } from '../types';
import { getRows } from '../api';

interface Props {
  schema: SchemaConfig;
  ui: UiConfig;
  fkContext: Record<string, number>;
}

export default function DenormalizedTableView({ schema, ui, fkContext }: Props) {
  const [rowData, setRowData] = useState<Record<string, any> | null>(null);
  const [editTable, setEditTable] = useState<string | null>(null);

  const firstTable = schema.sequence[0];

  useEffect(() => {
    const load = async () => {
      if (!fkContext[firstTable]) {
        setRowData(null);
        return;
      }
      const out: Record<string, any> = {};
      for (const table of schema.sequence) {
        const id = fkContext[table];
        if (id === undefined) continue;
        const rows = await getRows(table);
        const record = rows.find(r => r.id === id);
        if (record) {
          out[table] = record;
        }
      }
      setRowData(out);
    };
    load();
  }, [JSON.stringify(fkContext), schema]);

  const columns = useMemo(() => {
    const cols: { table: string; column: string }[] = [];
    schema.sequence.forEach(tbl => {
      const meta = schema.tables[tbl];
      [...meta.businessKeys, ...meta.columns].forEach(col => {
        cols.push({ table: tbl, column: col });
      });
    });
    return cols;
  }, [schema]);

  const currentEditScreen = useMemo(() => {
    if (!editTable) return null;
    const screen = ui.screens.find(s => s.table === editTable);
    if (!screen) return null;
    const fields: SectionSpec['fields'] = [];
    screen.sections.forEach(sec => {
      if (sec.fields) fields.push(...sec.fields);
    });
    return { title: screen.title, fields } as SectionSpec;
  }, [editTable, ui]);

  if (!fkContext[firstTable]) {
    return <p style={{ padding: 24 }}>Select a {firstTable} in Form View first.</p>;
  }

  return (
    <div className="table-view" style={{ padding: 24 }}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map(c => (
              <th key={`${c.table}.${c.column}`}>{c.table}.{c.column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {columns.map(c => (
              <td
                key={`${c.table}.${c.column}`}
                onClick={() => setEditTable(c.table)}
                style={{ cursor: 'pointer' }}
              >
                {rowData?.[c.table]?.[c.column] ?? ''}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      {editTable && currentEditScreen && rowData && (
        <div style={{ marginTop: 24 }}>
          <h3>Edit {editTable}</h3>
          <RenderSection
            spec={currentEditScreen}
            table={editTable}
            schemaTables={schema.tables}
            fkContext={fkContext}
            initialData={rowData[editTable]}
            onDone={() => {
              setEditTable(null);
              // Reload data to reflect changes
              (async () => {
                const out: Record<string, any> = {};
                for (const table of schema.sequence) {
                  const id = fkContext[table];
                  if (id === undefined) continue;
                  const rows = await getRows(table);
                  const record = rows.find(r => r.id === id);
                  if (record) {
                    out[table] = record;
                  }
                }
                setRowData(out);
              })();
            }}
          />
        </div>
      )}
    </div>
  );
}

//src/components/MultiStepForm.tsx
import { useMemo, useState } from 'react';
import RenderSection from './RenderSection';
import TableStep from './TableStep';
import { SchemaConfig, UiConfig, ScreenSpec, SectionSpec } from '../types';

interface Props {
  schemaCfg: SchemaConfig;
  uiCfg: UiConfig;
  /**
   * Callback fired whenever the foreign key context changes.
   * This allows parent components to react to selections made in the form
   * (e.g. enabling the table view once a Lot has been chosen).
   */
  onFkContextChange?: (ctx: Record<string, number>) => void;
}

export default function MultiStepForm({ schemaCfg, uiCfg, onFkContextChange }: Props) {
  const [fkContext, setFkContext] = useState<Record<string, number>>({});
  const [tableData, setTableData] = useState<Record<string, Record<string, any>>>({});
  const [stepIdx, setStepIdx] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [editingStep, setEditingStep] = useState<string | null>(null);
  const [history, setHistory] = useState<number[]>([0]);

  // Generate steps based on the schema config sequence and UI config
  const steps = useMemo(() => {
    const list: {
      id: string;
      screenIdx: number;
      sectionIdx: number;
      title: string;
      table: string;
      requiresBusinessKey: boolean;
      type: 'section' | 'table';
    }[] = [];

    schemaCfg.sequence.forEach((tableName, idx) => {
      const screenIdx = uiCfg.screens.findIndex(s => s.table === tableName);
      if (screenIdx === -1) return;
      const screen = uiCfg.screens[screenIdx];

      if (idx === 0) {
        screen.sections.forEach((section: SectionSpec, secIdx: number) => {
          const isBusinessKeySection = section.isBusinessKeySection === true;
          list.push({
            id: `${screen.table}_${secIdx}`,
            screenIdx,
            sectionIdx: secIdx,
            title: section.title,
            table: screen.table,
            requiresBusinessKey: isBusinessKeySection,
            type: 'section'
          });
        });
      } else {
        list.push({
          id: `${tableName}_table`,
          screenIdx,
          sectionIdx: 0,
          title: screen.title,
          table: tableName,
          requiresBusinessKey: false,
          type: 'table'
        });
      }
    });

    return list;
  }, [uiCfg, schemaCfg.sequence]);

  // Handle completion of a section
  const handleDone = (tbl: string, pk: number, sectionId: string) => {
    // Update foreign key context with the new primary key
    setFkContext(prev => {
      const updated = { ...prev, [tbl]: pk };
      onFkContextChange?.(updated);
      return updated;
    });
    
    // Mark this step as completed
    setCompletedSteps(prev => {
      const updated = new Set(prev);
      updated.add(sectionId);
      return updated;
    });
    
    // Exit editing mode if applicable
    if (editingStep === sectionId) {
      setEditingStep(null);
    }
    
    // Move to the next step
    const nextStep = stepIdx + 1;
    setStepIdx(nextStep);
    
    // Update navigation history
    setHistory(prev => [...prev, nextStep]);
  };

  const handleDataLoad = (tbl: string, data: Record<string, any>) => {
    setTableData(prev => ({ ...prev, [tbl]: data }));
  };
  
  // Handle going back to a previous step
  const handleGoToStep = (stepId: string, idx: number) => {
    if (completedSteps.has(stepId)) {
      setEditingStep(stepId);
      setStepIdx(idx);
      setHistory(prev => [...prev, idx]);
    }
  };
  
  // Go back to the previous step in history
  const goBack = () => {
    if (history.length > 1) {
      // Remove current step and get the previous one
      const newHistory = [...history];
      newHistory.pop();
      const prevStepIdx = newHistory[newHistory.length - 1];
      
      setHistory(newHistory);
      setStepIdx(prevStepIdx);
      
      // Clear editing mode
      setEditingStep(null);
    }
  };

  // Determine if a step should be visible based on its dependencies
  const isStepVisible = (idx: number) => {
    if (idx === 0) return true;

    const step = steps[idx];

    if (step.type === 'table') {
      const meta = schemaCfg.tables[step.table];
      if (meta.foreignKeys) {
        return Object.values(meta.foreignKeys).every(t => fkContext[t] !== undefined);
      }
      // Tables without foreign keys should only be shown once a related child
      // table has been selected. This prevents parent tables like Lot Class and
      // Material from appearing before a Lot has been chosen.
      const referencedByChild = Object.entries(schemaCfg.tables).some(([tbl, m]) =>
        Object.values(m.relationships || {}).some(rel =>
          rel.type === 'many' && rel.parentTable === step.table && fkContext[tbl] !== undefined
        )
      );
      return referencedByChild;
    }

    // Always show business key sections for the first table in sequence
    if (step.requiresBusinessKey && step.table === schemaCfg.sequence[0]) {
      return true;
    }
    
    // If this is a business key section, check if we have needed foreign keys
    if (step.requiresBusinessKey) {
      const tableMeta = schemaCfg.tables[step.table];
      // If this table has foreign keys, check if all required parent tables have been completed
      if (tableMeta.foreignKeys) {
        return Object.values(tableMeta.foreignKeys).every(
          parentTable => fkContext[parentTable] !== undefined
        );
      }
      return true;
    }
    
    // For non-business key sections, check if the business key section is completed
    const businessKeyStepId = steps.find(
      s => s.table === step.table && s.requiresBusinessKey
    )?.id;
    
    return businessKeyStepId && completedSteps.has(businessKeyStepId);
  };

  if (stepIdx >= steps.length)
    return (
      <main>
        <div className="form-header">
          <div></div>
          <button
            className="btn btn-primary"
            onClick={() => {
              setFkContext(prev => {
                const cleared: Record<string, number> = {};
                onFkContextChange?.(cleared);
                return cleared;
              });
              setStepIdx(0);
              setCompletedSteps(new Set());
              setTableData({});
              setEditingStep(null);
              setHistory([0]);
            }}
            type="button"
          >
            + Add Step
          </button>
        </div>
        <pre style={{ padding: 24 }}>
          Done! {JSON.stringify(fkContext, null, 2)}
        </pre>
      </main>
    );

  // Filter steps to show only those that should be visible
  const visibleSteps = steps.filter((_, idx) => isStepVisible(idx) || idx <= stepIdx);

  return (
    <main className="form-layout">
      <div className="form-content">
        {visibleSteps.map((s) => {
          const screen = uiCfg.screens[s.screenIdx];
          const isCompleted = completedSteps.has(s.id);
          const isCurrent = s.id === steps[stepIdx]?.id;
          const isEditing = editingStep === s.id;

          return (
          <div key={s.id} className={isCompleted && !isEditing ? 'completed-section' : ''}>
            <h2>{screen.title}</h2>
            {s.type === 'section' ? (
              <RenderSection
                spec={screen.sections[s.sectionIdx]}
                table={screen.table}
                schemaTables={schemaCfg.tables}
                fkContext={fkContext}
                initialData={tableData[screen.table]}
                onDataLoad={handleDataLoad}
                onDone={(tbl, pk) => handleDone(tbl, pk, s.id)}
                disabled={isCompleted && !isEditing && !isCurrent}
              />
            ) : (
              <TableStep
                table={s.table}
                screen={screen}
                schema={schemaCfg}
                fkContext={fkContext}
                initialData={tableData[s.table]}
                onDataLoad={handleDataLoad}
                onDone={(tbl, pk) => handleDone(tbl, pk, s.id)}
                isLastStep={steps[steps.length - 1]?.id === s.id}
              />
            )}
          </div>
        );
      })}
      </div>
      <aside className="form-sidebar">
        <ol className="steps">
          {steps.map((s, idx) => (
            <li
              key={s.id}
              className={
                completedSteps.has(s.id)
                  ? editingStep === s.id
                    ? 'done editing'
                    : 'done'
                  : idx === stepIdx
                  ? 'current'
                  : ''
              }
              onClick={() =>
                completedSteps.has(s.id) && handleGoToStep(s.id, idx)
              }
              style={{ cursor: completedSteps.has(s.id) ? 'pointer' : 'default' }}
            >
              {s.title}
            </li>
          ))}
        </ol>
        {history.length > 1 && (
          <button
            className="btn btn-secondary back-button"
            onClick={goBack}
            type="button"
          >
            ← Back
          </button>
        )}
      </aside>
    </main>
  );
}

//src/components/RecordSelector.tsx
import { useState, useEffect } from 'react';
import { BusinessKeyOption, FieldSpec, TableMeta } from '../types';
import { getRelatedBusinessKeys } from '../api';

interface RecordSelectorProps {
  table: string;
  parentTable: string | null;
  parentId: number | null;
  fields: FieldSpec[];
  schemaTables: Record<string, TableMeta>;
  onSelectRecord: (recordId: number, recordData: Record<string, any>) => void;
  onCreateNew: () => void;
}

export default function RecordSelector({
  table,
  parentTable,
  parentId,
  fields,
  schemaTables,
  onSelectRecord,
  onCreateNew
}: RecordSelectorProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<BusinessKeyOption[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  
  // Load related records when the component mounts
  useEffect(() => {
    const loadRecords = async () => {
      if (!parentTable || !parentId) {
        // No parent - this may be the first table in sequence
        setLoading(false);
        onCreateNew(); // Automatically show the create form
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const relatedRecords = await getRelatedBusinessKeys(
          table,
          parentTable,
          parentId,
          true // Include full record data
        );
        
        setRecords(relatedRecords);
        
        // If no records found, automatically switch to create mode
        if (relatedRecords.length === 0) {
          onCreateNew();
        }
      } catch (err) {
        setError(`Error loading related records: ${err instanceof Error ? err.message : String(err)}`);
        console.error("Failed to load related records:", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadRecords();
  }, [table, parentTable, parentId, onCreateNew]);
  
  // Handle record selection
  const handleRecordSelect = (record: BusinessKeyOption) => {
    setSelectedRecordId(record.id);
    
    if (record.recordData) {
      onSelectRecord(record.id, record.recordData);
    } else if (record.id) {
      // If recordData is missing but we have the ID, use a minimal object
      onSelectRecord(record.id, { id: record.id });
    }
  };
  
  // If no parent, or records still loading, show a loading placeholder
  if (loading) {
    return <div className="loading">Loading related records...</div>;
  }
  
  if (error) {
    return <div className="error-message">{error}</div>;
  }
  
  // If no records found, don't show anything (will automatically switch to create mode)
  if (records.length === 0) {
    return null;
  }
  
  // Get the business key column name(s) for display
  const businessKeyColumns = schemaTables[table]?.businessKeys || [];
  
  return (
    <div className="record-selection">
      <h4>Select an existing record or create a new one:</h4>
      
      <div className="record-list">
        {records.map((record) => (
          <div 
            key={record.id} 
            className={`record-item ${selectedRecordId === record.id ? 'selected' : ''}`}
            onClick={() => handleRecordSelect(record)}
          >
            <div className="record-selector">
              <input 
                type="radio" 
                checked={selectedRecordId === record.id}
                onChange={() => handleRecordSelect(record)}
                id={`record-${record.id}`}
              />
            </div>
            <div className="record-details">
              <label htmlFor={`record-${record.id}`} className="record-label">
                {/* Display business key value (or values if multiple) */}
                {businessKeyColumns.map(col => 
                  record.recordData ? 
                    String(record.recordData[col] || '') : 
                    typeof record.value === 'string' ? 
                      record.value : JSON.stringify(record.value)
                ).join(' - ')}
              </label>
              
              {selectedRecordId === record.id && record.recordData && (
                <div className="record-fields">
                  {fields.map((field) => {
                    if (!record.recordData || !record.recordData[field.column]) return null;
                    
                    return (
                      <div key={field.column} className="record-field">
                        <strong>{field.column}:</strong> {String(record.recordData[field.column])}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="selection-actions">
        <button 
          type="button" 
          className="btn btn-secondary" 
          onClick={onCreateNew}
        >
          Create New
        </button>
        
        <button 
          type="button" 
          className="btn btn-primary"
          disabled={!selectedRecordId}
          onClick={() => {
            const record = records.find(r => r.id === selectedRecordId);
            if (record && record.recordData) {
              onSelectRecord(record.id, record.recordData);
            }
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
//src/components/RenderSection.tsx
import {
  useForm,
  SubmitHandler,
  UseFormRegister,
  useFieldArray,
  Controller,
} from 'react-hook-form';
import { useState, useEffect, useMemo } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable
} from '@tanstack/react-table';

import {
  SectionSpec,
  NestedRepeatSpec,
  TableMeta,
  FieldSpec,
  BusinessKeyOption,
} from '../types';
import { submitRow, getBusinessKeys, getRelatedData, getRelatedBusinessKeys, getRows } from '../api';

/**
 * Props for RenderSection component
 */
interface Props {
  spec: SectionSpec | NestedRepeatSpec;
  table: string; // logical table this block writes to
  schemaTables: Record<string, TableMeta>;
  fkContext: Record<string, number>;
  onDone?: (table: string, pk: number) => void;
  disabled?: boolean; // New prop to disable the form when completed
  initialData?: Record<string, any>;
  onDataLoad?: (table: string, data: Record<string, any>) => void;
} 

/* ───────────────────────────── editable cell ────────────────────────────── */
interface EditableCellProps {
  table: string;
  columnSpec: FieldSpec;
  value: any;
  isBusinessKey: boolean;
  schemaTables: Record<string, TableMeta>;
  fkContext: Record<string, number>;
  disabled: boolean;
  onChange: (val: any) => void;
  onRowDataLoad: (data: Record<string, any>) => void;
}

function EditableCell({
  table,
  columnSpec,
  value,
  isBusinessKey,
  schemaTables,
  fkContext,
  disabled,
  onChange,
  onRowDataLoad
}: EditableCellProps) {
  const [businessKeyOptions, setBusinessKeyOptions] = useState<BusinessKeyOption[]>([]);
  const [loading, setLoading] = useState(false);

  const getManyRelationship = () => {
    if (!isBusinessKey) return null;
    const tableMeta = schemaTables[table];
    if (!tableMeta || !tableMeta.relationships) return null;
    for (const rel of Object.values(tableMeta.relationships)) {
      if (rel.type === 'many') {
        return { parentTable: rel.parentTable, parentKey: rel.parentKey };
      }
    }
    for (const [other, otherMeta] of Object.entries(schemaTables)) {
      if (!otherMeta.relationships) continue;
      for (const rel of Object.values(otherMeta.relationships)) {
        if (rel.type === 'many' && rel.childTable === table && fkContext[other]) {
          return { parentTable: other, parentKey: rel.childKey };
        }
      }
    }
    return null;
  };

  const manyRelationship = useMemo(
    () => getManyRelationship(),
    [isBusinessKey, table, fkContext]
  );

  useEffect(() => {
    if (isBusinessKey && !disabled) {
      const load = async () => {
        try {
          setLoading(true);
          if (manyRelationship && fkContext[manyRelationship.parentTable!]) {
            const opts = await getRelatedBusinessKeys(
              table,
              manyRelationship.parentTable!,
              fkContext[manyRelationship.parentTable!]
            );
            setBusinessKeyOptions(opts);
          } else {
            const opts = await getBusinessKeys(table);
            setBusinessKeyOptions(opts);
          }
        } finally {
          setLoading(false);
        }
      };
      load();
    }
  }, [isBusinessKey, table, disabled, JSON.stringify(fkContext)]);

  const handleBusinessKeyChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const val = e.target.value;
    onChange(val);
    if (!val || !isBusinessKey) return;
    // Only load related data if the value exists in the dropdown options
    if (businessKeyOptions.some(o => o.value === val)) {
      try {
        setLoading(true);
        const data = await getRelatedData(table, columnSpec.column, val);
        onRowDataLoad(data);
      } finally {
        setLoading(false);
      }
    }
  };

  return isBusinessKey ? (
    <div className="business-key-select">
      <input
        type={columnSpec.widget}
        list={`bk-${table}-${columnSpec.column}`}
        value={value ?? ''}
        onChange={handleBusinessKeyChange}
        disabled={disabled || loading}
      />
      <datalist id={`bk-${table}-${columnSpec.column}`}> 
        {businessKeyOptions.map(o => (
          <option key={o.id} value={o.value} />
        ))}
      </datalist>
      {loading && <span className="loading-indicator">Loading...</span>}
    </div>
  ) : columnSpec.widget === 'select' ? (
    <select value={value ?? ''} onChange={e => onChange(e.target.value)} disabled={disabled}>
      <option value="">Select...</option>
      {columnSpec.options?.map(o => (
        <option key={o}>{o}</option>
      ))}
    </select>
  ) : (
    <input
      type={columnSpec.widget}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
    />
  );
}


/* ── run‑time guards ─────────────────────────────────────────────────────── */
const isRepeat = (
  s: SectionSpec | NestedRepeatSpec,
): s is NestedRepeatSpec => (s as NestedRepeatSpec).repeat === true;
const isSelect = (f: FieldSpec) => f.widget === 'select';

/* ─────────────────────────────────────────────────────────────────────────── */
export default function RenderSection({
  spec,
  table,
  schemaTables,
  fkContext,
  onDone,
  disabled = false,
  initialData,
  onDataLoad,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedData, setSavedData] = useState<Record<string, unknown> | null>(null);
  const [nestedComplete, setNestedComplete] = useState(false);

  /* ─────────────────────── simple (non‑repeat) section ─────────────────── */
  if (!isRepeat(spec)) {
    const { 
      register, 
      handleSubmit, 
      formState: { errors }, 
      reset,
      control,
      setValue 
    } = useForm<Record<string, unknown>>({ defaultValues: initialData });

    useEffect(() => {
      if (initialData) {
        reset(initialData);
      }
    }, [JSON.stringify(initialData)]);

    const save: SubmitHandler<Record<string, unknown>> = async (data) => {
      if (loading || disabled) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // add FK columns based on schema_config
        const meta = schemaTables[table];
        Object.entries(meta.foreignKeys ?? {}).forEach(([col, refTbl]) => {
          data[col] = fkContext[refTbl];
        });
        
        const { surrogatePK } = await submitRow(table, data);
        
        // Save the data locally to display in the disabled state
        setSavedData(data);
        
        // Only call onDone if we don't have nested sections or they're complete
        if (!spec.nested || nestedComplete) {
          onDone?.(table, surrogatePK);
        } else {
          // If we have nested sections that aren't complete, we need to save the surrogate PK
          // so it can be used as a foreign key for the nested items
          setFkContext((prev: Record<string, number>) => ({ 
            ...prev, 
            [table]: surrogatePK 
          }));
        }
      } catch (err) {
        setError(`Error saving data: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };

    // Handle completion of nested sections
    const handleNestedDone = (nestedTable: string, nestedPk: number) => {
      setNestedComplete(true);
      // Now that nested items are complete, we can move to the next step
      if (savedData) {
        onDone?.(table, fkContext[table]);
      }
    };

    return (
      <section className={`section ${disabled ? 'disabled-section' : ''}`}>
        <h3>{spec.title}</h3>

        {error && <div className="error-message">{error}</div>}

        {disabled && savedData ? (
          // Display saved data in read-only mode when disabled
          <div className="saved-data">
            {spec.fields?.map((f) => (
              <div key={f.column} className="field">
                <label>{f.column}</label>
                <div className="field-value">{String(savedData[f.column] || '')}</div>
              </div>
            ))}
          </div>
        ) : (
          // Display editable form when not disabled
          <form onSubmit={handleSubmit(save)}>
            {spec.fields?.map((f) => {
              // Check if this is a business key field
              const isBusinessKey = schemaTables[table]?.businessKeys.includes(f.column);
              
              return (
                <Field 
                  key={f.column} 
                  f={f} 
                  register={register} 
                  path={f.column} 
                  disabled={disabled || loading}
                  error={errors[f.column]?.message as string}
                  table={table}
                  isBusinessKey={isBusinessKey}
                  schemaTables={schemaTables}
                  control={control}
                  setValue={setValue}
                  fkContext={fkContext}
                  onDataLoad={data => onDataLoad?.(table, data)}
                />
              );
            })}

            {!disabled && !savedData && (
              <button
                className="btn btn-primary"
                type="submit"
                disabled={loading || disabled}
              >
                {loading ? 'Saving...' : 'Next'}
              </button>
            )}
          </form>
        )}

        {/* nested repeat block - only show after parent form is saved */}
        {spec.nested && (savedData || disabled) && (
          <RenderSection
            spec={spec.nested}
            table={spec.nested.table}
            schemaTables={schemaTables}
            fkContext={fkContext}
            initialData={initialData}
            onDataLoad={onDataLoad}
            onDone={handleNestedDone}
            disabled={disabled}
          />
        )}
      </section>
    );
  }

  /* ───────────────────── repeat (array‑of‑rows) section ─────────────────── */
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<{
    rows: Record<string, unknown>[];
  }>({ defaultValues: { rows: [] } });
  const { fields, append, remove } = useFieldArray({ control, name: 'rows' });

  useEffect(() => {
    const load = async () => {
      try {
        const meta = schemaTables[spec.table];
        const rel = Object.values(meta.relationships || {}).find(
          r => r.parentTable && fkContext[r.parentTable] !== undefined
        );
        if (rel) {
          const data = await getRows(
            spec.table,
            rel.parentTable!,
            fkContext[rel.parentTable!]
          );
          setRows(data);
        }
      } catch (err) {
        console.error('Error loading rows', err);
      }
    };

    load();
  }, [JSON.stringify(fkContext)]);

  const addRow = () => append({});

  const saveLine =
    (idx: number): SubmitHandler<{ rows: Record<string, unknown>[] }> =>
    async (formData) => {
      if (loading || disabled) return;

      try {
        setLoading(true);
        setError(null);

        const row = formData.rows[idx];
        const meta = schemaTables[spec.table];

        // Add foreign keys from context
        Object.entries(meta.foreignKeys ?? {}).forEach(([col, refTbl]) => {
          row[col] = fkContext[refTbl];
        });

        const { surrogatePK } = await submitRow(spec.table, row);

        // Store the saved row
        setRows(prev => [...prev, { ...row, id: surrogatePK }]);

        // Remove the form row after saving
        remove(idx);
      } catch (err) {
        setError(`Error saving row: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };

  // Complete the entire repeatable section
  const completeSection = () => {
    if (rows.length > 0) {
      onDone?.(table, fkContext[table]);
    } else {
      setError('Please add at least one row before completing');
    }
  };

  const inner = spec.sections[0]; // simplified: one section description
  const handleCellChange = (idx: number, col: string, value: any) => {
    setRows(prev => {
      const out = [...prev];
      out[idx] = { ...out[idx], [col]: value };
      return out;
    });
  };

  const applyRelatedData = (idx: number, data: Record<string, any>) => {
    setRows(prev => {
      const out = [...prev];
      out[idx] = { ...out[idx], ...data };
      return out;
    });
  };

  const saveExistingRow = (idx: number) => async () => {
    if (loading || disabled) return;
    try {
      setLoading(true);
      setError(null);
      const row = { ...rows[idx] };
      const meta = schemaTables[spec.table];
      Object.entries(meta.foreignKeys ?? {}).forEach(([c, ref]) => {
        row[c] = fkContext[ref];
      });
      await submitRow(spec.table, row);
    } catch (err) {
      setError(
        `Error saving row: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo<ColumnDef<Record<string, any>>[]>(() => {
    if (!inner.fields) return [];
    const meta = schemaTables[spec.table];
    const cols: ColumnDef<Record<string, any>>[] = inner.fields.map(f => ({
      accessorKey: f.column,
      header: f.column,
      cell: info => (
        <EditableCell
          table={spec.table}
          columnSpec={f}
          value={info.getValue() as any}
          schemaTables={schemaTables}
          fkContext={fkContext}
          disabled={disabled}
          isBusinessKey={meta.businessKeys.includes(f.column)}
          onChange={v => handleCellChange(info.row.index, f.column, v)}
          onRowDataLoad={d => applyRelatedData(info.row.index, d)}
        />
      )
    }));

    // Removed inlined save column for cleaner UI
    return cols;
  }, [rows, fkContext, disabled]);

  const tableInstance = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });


  return (
    <section className={`section ${disabled ? 'disabled-section' : ''}`}>
      <h3>{inner.title}</h3>

      {error && <div className="error-message">{error}</div>}

      {rows.length > 0 && (
        <table className="data-table" style={{ marginBottom: 16 }}>
          <thead>
            {tableInstance.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {tableInstance.getRowModel().rows.map(row => (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Only show form for new rows if not disabled */}
      {!disabled && (
        <>
          {fields.map((field, idx) => (
            <form
              key={field.id}
              onSubmit={handleSubmit(saveLine(idx))}
              className="section"
              style={{ padding: 16, marginBottom: 16 }}
            >
              {inner.fields?.map((f) => {
                // Check if this is a business key field
                const isBusinessKey = schemaTables[spec.table]?.businessKeys.includes(f.column);
                
                return (
                  <Field
                    key={f.column}
                    f={f}
                    register={register}
                    path={`rows.${idx}.${f.column}`}
                    disabled={loading}
                    error={errors.rows?.[idx]?.[f.column]?.message as string}
                    table={spec.table}
                    isBusinessKey={isBusinessKey}
                    schemaTables={schemaTables}
                    control={control}
                    setValue={setValue}
                    fkContext={fkContext}
                    onDataLoad={data => onDataLoad?.(spec.table, data)}
                  />
                );
              })}
              <button 
                className="btn btn-small btn-primary" 
                type="submit"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Row'}
              </button>
            </form>
          ))}

          <div className="repeat-actions">
            <button 
              type="button" 
              onClick={addRow} 
              className="btn btn-secondary"
              disabled={loading}
            >
              + Add Row
            </button>
            
            {rows.length > 0 && (
              <button
                type="button"
                onClick={completeSection}
                className="btn btn-primary"
                disabled={loading}
              >
                Next
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}

/* ───────────────────────────── leaf field ─────────────────────────────── */
interface FieldProps {
  f: FieldSpec;
  register: UseFormRegister<any>;
  path: string; // absolute path for react‑hook‑form register
  disabled?: boolean;
  error?: string;
  table: string;
  isBusinessKey?: boolean;
  schemaTables: Record<string, TableMeta>;
  control: any;
  setValue: any;
  fkContext: Record<string, number>;
  onDataLoad?: (data: Record<string, any>) => void;
}

function Field({ 
  f, 
  register, 
  path, 
  disabled = false, 
  error, 
  table, 
  isBusinessKey = false,
  schemaTables,
  control,
  setValue,
  fkContext,
  onDataLoad
}: FieldProps) {
  const [businessKeyOptions, setBusinessKeyOptions] = useState<BusinessKeyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Check if this is a "many" relationship
  const getManyRelationship = () => {
    if (!isBusinessKey) return null;
    
    const tableMeta = schemaTables[table];
    if (!tableMeta || !tableMeta.relationships) return null;
    
    // Check for any "many" relationship
    for (const [relName, relData] of Object.entries(tableMeta.relationships || {})) {
      if (relData.type === 'many') {
        return {
          parentTable: relData.parentTable,
          parentKey: relData.parentKey
        };
      }
    }
    
    // Also check if we're the child in a many relationship
    for (const [otherTable, otherMeta] of Object.entries(schemaTables)) {
      if (!otherMeta.relationships) continue;
      
      for (const [relName, relData] of Object.entries(otherMeta.relationships)) {
        if (relData.type === 'many' && 
            relData.childTable === table &&
            fkContext[otherTable]) {
          return {
            parentTable: otherTable,
            parentKey: relData.childKey
          };
        }
      }
    }
    
    return null;
  };
  
  const manyRelationship = useMemo(
    () => getManyRelationship(),
    [isBusinessKey, table, fkContext]
  );
  
  // Load business key options when rendering a business key field
  useEffect(() => {
    if (isBusinessKey && !disabled) {
      const loadBusinessKeys = async () => {
        try {
          setLoading(true);
          setLoadError(null);
          
          // For "many" relationships, load related business keys
          if (manyRelationship && fkContext && manyRelationship.parentTable && 
              fkContext[manyRelationship.parentTable]) {
            console.log('Loading related business keys for', table, 'related to', manyRelationship.parentTable);
            const parentId = fkContext[manyRelationship.parentTable];
            const options = await getRelatedBusinessKeys(
              table, 
              manyRelationship.parentTable, 
              parentId
            );
            setBusinessKeyOptions(options);
          } else {
            // Regular business key loading
            const options = await getBusinessKeys(table);
            setBusinessKeyOptions(options);
          }
        } catch (err) {
          setLoadError(`Failed to load options: ${err instanceof Error ? err.message : String(err)}`);
          console.error('Error loading business key options:', err);
        } finally {
          setLoading(false);
        }
      };

      loadBusinessKeys();
    }
  }, [isBusinessKey, table, disabled, manyRelationship, fkContext]);

  // Handle selection of a business key to load related data
  const handleBusinessKeyChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const keyValue = event.target.value;
    setValue(path, keyValue);
    if (!keyValue || !isBusinessKey) return;
    // Only fetch related data if the value exists in the dropdown options
    if (!businessKeyOptions.some(o => o.value === keyValue)) return;
    
    try {
      setLoading(true);
      setLoadError(null);
      
      // Get related data based on the selected business key
      const data = await getRelatedData(table, f.column, keyValue);

      if (onDataLoad) {
        onDataLoad(data);
      }
      
      // Set form values for all fields from the related data
      Object.entries(data).forEach(([key, value]) => {
        // Don't set the ID or the business key itself (already set)
        if (key !== 'id' && key !== f.column) {
          const segments = path.split('.');
          segments[segments.length - 1] = key;
          const targetPath = segments.join('.');
          setValue(targetPath, value);
        }
      });
    } catch (err) {
      setLoadError(`Failed to load related data: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Error loading related data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Determine if we should show this as a dropdown with options
  const showBusinessKeyInput = isBusinessKey;

  return (
    <div className={`field ${error || loadError ? 'has-error' : ''}`}>
      <label>{f.column}</label>

      {showBusinessKeyInput ? (
        <div className="business-key-select">
          <input
            type={f.widget}
            list={`bk-${table}-${f.column}`}
            placeholder={`Select or enter ${f.column}`}
            {...register(path)}
            onChange={handleBusinessKeyChange}
            disabled={disabled || loading}
          />
          <datalist id={`bk-${table}-${f.column}`}>
            {businessKeyOptions.map((option) => (
              <option key={option.id} value={typeof option.value === 'string' ? option.value : String(option.id)} />
            ))}
          </datalist>
          {loading && <span className="loading-indicator">Loading...</span>}
        </div>
      ) : isSelect(f) ? (
        // Regular select dropdown
        <select {...register(path)} disabled={disabled}>
          <option value="">Select...</option>
          {f.options?.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : (
        // Regular input field
        <input 
          {...register(path)} 
          type={f.widget} 
          disabled={disabled}
        />
      )}
      
      {error && <div className="error-message">{error}</div>}
      {loadError && <div className="error-message">{loadError}</div>}
    </div>
  );
}

//src/components/TableStep.tsx
import { useEffect, useState, useMemo } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable
} from '@tanstack/react-table';
import RenderSection from './RenderSection';
import {
  SchemaConfig,
  ScreenSpec,
  TableMeta,
  SectionSpec,
  FieldSpec,
  BusinessKeyOption
} from '../types';
import {
  getRows,
  submitRow,
  getBusinessKeys,
  getRelatedData,
  getRelatedBusinessKeys
} from '../api';

interface EditableCellProps {
  table: string;
  columnSpec: FieldSpec;
  value: any;
  isBusinessKey: boolean;
  schemaTables: Record<string, TableMeta>;
  fkContext: Record<string, number>;
  disabled: boolean;
  onChange: (val: any) => void;
  onRowDataLoad: (data: Record<string, any>) => void;
}

function EditableCell({
  table,
  columnSpec,
  value,
  isBusinessKey,
  schemaTables,
  fkContext,
  disabled,
  onChange,
  onRowDataLoad
}: EditableCellProps) {
  const [businessKeyOptions, setBusinessKeyOptions] = useState<BusinessKeyOption[]>([]);
  const [loading, setLoading] = useState(false);

  const getManyRelationship = () => {
    if (!isBusinessKey) return null;
    const tableMeta = schemaTables[table];
    if (!tableMeta || !tableMeta.relationships) return null;
    for (const rel of Object.values(tableMeta.relationships)) {
      if (rel.type === 'many') {
        return { parentTable: rel.parentTable, parentKey: rel.parentKey };
      }
    }
    for (const [other, otherMeta] of Object.entries(schemaTables)) {
      if (!otherMeta.relationships) continue;
      for (const rel of Object.values(otherMeta.relationships)) {
        if (rel.type === 'many' && rel.childTable === table && fkContext[other]) {
          return { parentTable: other, parentKey: rel.childKey };
        }
      }
    }
    return null;
  };

  const manyRelationship = getManyRelationship();

  useEffect(() => {
    if (isBusinessKey && !disabled) {
      const load = async () => {
        try {
          setLoading(true);
          if (manyRelationship && fkContext[manyRelationship.parentTable!]) {
            const opts = await getRelatedBusinessKeys(
              table,
              manyRelationship.parentTable!,
              fkContext[manyRelationship.parentTable!]
            );
            setBusinessKeyOptions(opts);
          } else {
            const opts = await getBusinessKeys(table);
            setBusinessKeyOptions(opts);
          }
        } finally {
          setLoading(false);
        }
      };
      load();
    }
  }, [isBusinessKey, table, disabled, JSON.stringify(fkContext)]);

  const handleBusinessKeyChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const val = e.target.value;
    onChange(val);
    if (!isBusinessKey) return;
    if (!businessKeyOptions.some(o => o.value === val)) return;
    try {
      setLoading(true);
      const data = await getRelatedData(table, columnSpec.column, val);
      onRowDataLoad(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const val = value as string;
    if (!isBusinessKey || !val || disabled) return;
    const load = async () => {
      try {
        setLoading(true);
        const data = await getRelatedData(table, columnSpec.column, val);
        onRowDataLoad(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isBusinessKey, value, table, columnSpec.column, disabled]);

  return isBusinessKey ? (
    <div className="business-key-select">
      <input
        type={columnSpec.widget}
        list={`bk-${table}-${columnSpec.column}`}
        value={value ?? ''}
        onChange={handleBusinessKeyChange}
        disabled={disabled || loading}
      />
      <datalist id={`bk-${table}-${columnSpec.column}`}> 
        {businessKeyOptions.map(o => (
          <option key={o.id} value={o.value} />
        ))}
      </datalist>
      {loading && <span className="loading-indicator">Loading...</span>}
    </div>
  ) : columnSpec.widget === 'select' ? (
    <select value={value ?? ''} onChange={e => onChange(e.target.value)} disabled={disabled}>
      <option value="">Select...</option>
      {columnSpec.options?.map(o => (
        <option key={o}>{o}</option>
      ))}
    </select>
  ) : (
    <input
      type={columnSpec.widget}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
    />
  );
}


interface Props {
  table: string;
  screen: ScreenSpec;
  schema: SchemaConfig;
  fkContext: Record<string, number>;
  onDone: (table: string, id: number) => void;
  onDataLoad?: (table: string, data: Record<string, any>) => void;
  initialData?: Record<string, any>;
  /**
   * When true, this table represents the final step of the form and the
   * confirmation button should show "Save" instead of "Next".
   */
  isLastStep?: boolean;
}

export default function TableStep({
  table,
  screen,
  schema,
  fkContext,
  onDone,
  onDataLoad,
  initialData,
  isLastStep = false,
}: Props) {
  const meta: TableMeta = schema.tables[table];
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  const load = async () => {
    let parentTable: string | undefined;
    let parentId: number | undefined;
    if (meta.foreignKeys) {
      for (const [col, ref] of Object.entries(meta.foreignKeys)) {
        if (fkContext[ref] !== undefined) {
          parentTable = ref;
          parentId = fkContext[ref];
          break;
        }
      }
    }
    const data = await getRows(table, parentTable, parentId);
    setRows(data);
    return data;
  };

  useEffect(() => {
    load();
    setSelected(null);
  }, [JSON.stringify(fkContext)]);

  const handleAdd = async (pk: number) => {
    const data = await load();
    setSelected(pk);
    const newRow = data.find(r => r.id === pk);
    if (newRow) {
      onDataLoad?.(table, newRow);
    }
    setAdding(false);
    onDone(table, pk);
  };

  const hasMany = Object.values(meta.relationships || {}).some(r => r.type === 'many');

  const addSection: SectionSpec = useMemo(() => {
    const fields: SectionSpec['fields'] = [];
    let nested: any = undefined;
    screen.sections.forEach(sec => {
      if (sec.fields) fields.push(...sec.fields);
      if (!nested && (sec as any).nested) {
        nested = (sec as any).nested;
      }
    });
    return { title: screen.title, fields, nested } as SectionSpec;
  }, [screen]);

  const fieldMap = useMemo(() => {
    const map: Record<string, FieldSpec> = {};
    screen.sections.forEach(sec => {
      sec.fields?.forEach(f => {
        map[f.column] = f;
      });
    });
    return map;
  }, [screen]);

  const handleCellChange = (idx: number, col: string, value: any) => {
    setRows(prev => {
      const out = [...prev];
      out[idx] = { ...out[idx], [col]: value };
      return out;
    });
  };

  const applyRelatedData = (idx: number, data: Record<string, any>) => {
    setRows(prev => {
      const out = [...prev];
      out[idx] = { ...out[idx], ...data };
      return out;
    });
  };

  const saveExistingRow = async (idx: number) => {
    const row = { ...rows[idx] };
    Object.entries(meta.foreignKeys ?? {}).forEach(([c, ref]) => {
      row[c] = fkContext[ref];
    });
    await submitRow(table, row);
  };


  const columns = useMemo<ColumnDef<Record<string, any>>[]>(() => {
    return [
      {
        id: 'select',
        header: 'Select',
        cell: ({ row }) => (
          <input
            type="radio"
            checked={selected === row.original.id}
            onChange={() => {
              setSelected(row.original.id as number);
              onDataLoad?.(table, row.original);
            }}
          />
        )
      },
      ...[...meta.businessKeys, ...meta.columns].map<ColumnDef<Record<string, any>>>((col) => ({
        accessorKey: col,
        header: col,
        cell: info => {
          const rowIdx = info.row.index;
          const value = info.getValue();
          const isBk = meta.businessKeys.includes(col);
          const spec = fieldMap[col] || { column: col, widget: 'text' };
          return info.row.original.id === selected ? (
            <EditableCell
              table={table}
              columnSpec={spec}
              value={value}
              isBusinessKey={isBk}
              schemaTables={schema.tables}
              fkContext={fkContext}
              disabled={false}
              onChange={v => handleCellChange(rowIdx, col, v)}
              onRowDataLoad={d => applyRelatedData(rowIdx, d)}
            />
          ) : (
            String(value ?? '')
          );
        }
      })),
      // Save column removed
    ];
  }, [selected, rows, fkContext]);

  const tableInstance = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="table-step">
      {rows.length > 0 && (
        <table className="data-table">
          <thead>
            {tableInstance.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {tableInstance.getRowModel().rows.map(row => (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selected !== null && (
        <button
          className="btn btn-primary"
          onClick={async () => {
            const idx = rows.findIndex(r => r.id === selected);
            if (idx !== -1) {
              await saveExistingRow(idx);
            }
            onDone(table, selected!);
          }}
        >
          {isLastStep ? 'Save' : 'Next'}
        </button>
      )}

      {hasMany && !adding && (
        <button className="btn" onClick={() => setAdding(true)}>
          + Add Row
        </button>
      )}

      {adding && (
        <RenderSection
          spec={addSection}
          table={table}
          schemaTables={schema.tables}
          fkContext={fkContext}
          initialData={initialData}
          onDataLoad={onDataLoad}
          onDone={handleAdd}
        />
      )}
    </div>
  );
}

//src/api.ts
import axios, { AxiosError } from 'axios';
import { SchemaConfig, UiConfig, BusinessKeyOption } from './types';

// Create API instance with default config
const api = axios.create({ 
  baseURL: 'http://127.0.0.1:8000',
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Handle API error responses
const handleApiError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    
    if (axiosError.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const status = axiosError.response.status;
      const data = axiosError.response.data as any;
      
      const errorMessage = data?.detail || 
        data?.message || 
        `Error ${status}: ${axiosError.message}`;
      
      throw new Error(errorMessage);
    } else if (axiosError.request) {
      // The request was made but no response was received
      throw new Error('No response received from server. Please check your connection.');
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error(`Request configuration error: ${axiosError.message}`);
    }
  }
  
  // For non-Axios errors, rethrow
  throw error;
};

/**
 * Fetch schema configuration from the backend
 * @returns Promise with schema configuration
 */
export const getSchemaCfg = async (): Promise<SchemaConfig> => {
  try {
    const response = await api.get<SchemaConfig>('/schema-config');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Fetch UI configuration from the backend
 * @returns Promise with UI configuration
 */
export const getUiCfg = async (): Promise<UiConfig> => {
  try {
    const response = await api.get<UiConfig>('/ui-config');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Fetch available business key values for a table
 * @param table The table name to get business keys for
 * @returns Promise with business key options
 */
export const getBusinessKeys = async (
  table: string
): Promise<BusinessKeyOption[]> => {
  try {
    const response = await api.get<{ id: number; value: string }[]>(
      `/business-keys/${table}`
    );
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Fetch business key values related to a parent record
 * @param table The table name to get business keys for
 * @param parentTable The parent table name
 * @param parentId The parent record ID
 * @returns Promise with business key options
 */
export const getRelatedBusinessKeys = async (
  table: string,
  parentTable: string,
  parentId: number
): Promise<BusinessKeyOption[]> => {
  try {
    const response = await api.get<{ id: number; value: string }[]>(
      `/related-business-keys/${table}/${parentTable}/${parentId}`
    );
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Fetch data for a record based on its business key
 * @param table The table name
 * @param keyColumn The business key column name
 * @param keyValue The business key value
 * @returns Promise with the record data
 */
export const getRelatedData = async (
  table: string,
  keyColumn: string,
  keyValue: string
): Promise<Record<string, any>> => {
  try {
    const response = await api.get<Record<string, any>>(
      `/related-data/${table}/${keyColumn}/${keyValue}`
    );
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Submit a row of data to the backend
 * @param table The table name to submit to
 * @param row The data to submit
 * @returns Promise with the surrogate primary key
 */
export const submitRow = async <T extends Record<string, unknown>>(
  table: string,
  row: T
): Promise<{ surrogatePK: number }> => {
  try {
    const response = await api.post<{ surrogatePK: number }>(
      `/submit/${table}`, 
      { data: row }
    );
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Fetch rows for a table, optionally filtered by parent relationship
 */
export const getRows = async (
  table: string,
  parentTable?: string,
  parentId?: number
): Promise<Record<string, any>[]> => {
  try {
    const params: Record<string, any> = {};
    if (parentTable) params.parent_table = parentTable;
    if (parentId !== undefined) params.parent_id = parentId;
    const response = await api.get<Record<string, any>[]>(`/rows/${table}`, {
      params
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

//src/App.tsx
import { useEffect, useState } from 'react';
import { getSchemaCfg, getUiCfg } from './api';
import { SchemaConfig, UiConfig } from './types';
import MultiStepForm from './components/MultiStepForm';
import DenormalizedTableView from './components/DenormalizedTableView';

export default function App() {
  const [schemaCfg, setSchemaCfg] = useState<SchemaConfig | undefined>(undefined);
  const [uiCfg, setUiCfg] = useState<UiConfig | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Track which main view is active
  const [view, setView] = useState<'form' | 'table' | 'option3'>('form');
  // Share selected foreign key context with table view
  const [fkContext, setFkContext] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadConfigurations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load both configurations in parallel
        const [schemaConfig, uiConfig] = await Promise.all([
          getSchemaCfg(),
          getUiCfg()
        ]);
        
        // Update state with loaded configurations
        setSchemaCfg(schemaConfig);
        setUiCfg(uiConfig);
      } catch (err) {
        // Handle any errors that occurred during data loading
        setError(`Failed to load configuration: ${err instanceof Error ? err.message : String(err)}`);
        console.error('Configuration loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadConfigurations();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="app-loading" style={{ padding: 24 }}>
        <p>Loading configuration…</p>
      </div>
    );
  }

  // Show error state if loading failed
  if (error || !schemaCfg || !uiCfg) {
    return (
      <div className="app-error" style={{ padding: 24 }}>
        <h2>Error Loading Application</h2>
        <p>{error || "Configuration data is missing"}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="btn btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  // Callback from MultiStepForm when selections change
  const handleFkCtxChange = (ctx: Record<string, number>) => setFkContext(ctx);

  const renderContent = () => {
    if (view === 'form') {
      return (
        <MultiStepForm
          schemaCfg={schemaCfg}
          uiCfg={uiCfg}
          onFkContextChange={handleFkCtxChange}
        />
      );
    }
    if (view === 'table') {
      return (
        <DenormalizedTableView schema={schemaCfg} ui={uiCfg} fkContext={fkContext} />
      );
    }
    return <p style={{ padding: 24 }}>Option 3 placeholder</p>;
  };

  return (
    <div className="app-menu-layout">
      <nav className="left-menu">
        <ul>
          <li
            className={view === 'form' ? 'active' : ''}
            onClick={() => setView('form')}
          >
            Form View
          </li>
          <li
            className={view === 'table' ? 'active' : ''}
            onClick={() => setView('table')}
          >
            Table View
          </li>
          <li
            className={view === 'option3' ? 'active' : ''}
            onClick={() => setView('option3')}
          >
            Option 3
          </li>
        </ul>
      </nav>
      <div className="menu-content">{renderContent()}</div>
    </div>
  );
}


//src/main.ts 
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  React.createElement(React.StrictMode, null, React.createElement(App))
);


//main.py
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from pathlib import Path
import json
import sqlite3
from typing import Dict, Any, List, Optional
from fastapi.middleware.cors import CORSMiddleware

ROOT = Path(__file__).parent
schema_cfg = json.loads((ROOT / "schema_config.json").read_text())
ui_cfg     = json.loads((ROOT / "ui_config.json").read_text())

app = FastAPI(title="3-NF demo API (decoupled configs)")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      #  ["*"] is OK for local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SQLite database setup
DB_PATH = ROOT / "writeback.db"

def get_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

# Create tables and initialize with dummy data if needed
def init_db():
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()

    # Create tables
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS lot_class (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_code TEXT UNIQUE,
        description TEXT
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS material (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        material_code TEXT UNIQUE,
        description TEXT
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS lot (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lot_number TEXT UNIQUE,
        lot_class_id INTEGER,
        material_id INTEGER,
        manufacture_date TEXT,
        expiry_date TEXT,
        quantity REAL,
        FOREIGN KEY (lot_class_id) REFERENCES lot_class(id),
        FOREIGN KEY (material_id) REFERENCES material(id)
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS batch (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_number TEXT UNIQUE,
        lot_id INTEGER,
        start_date TEXT,
        end_date TEXT,
        status TEXT,
        quantity_produced REAL,
        FOREIGN KEY (lot_id) REFERENCES lot(id)
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS batch_step (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_id INTEGER,
        step_number INTEGER,
        description TEXT,
        operator TEXT,
        completion_date TEXT,
        FOREIGN KEY (batch_id) REFERENCES batch(id),
        UNIQUE(batch_id, step_number)
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS container (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_id INTEGER,
        container_id TEXT UNIQUE,
        location TEXT,
        quantity REAL,
        status TEXT,
        FOREIGN KEY (batch_id) REFERENCES batch(id)
    )
    ''')

    # Add dummy data if tables are empty
    cursor.execute("SELECT COUNT(*) FROM lot_class")
    if cursor.fetchone()[0] == 0:
        lot_classes = [
            ("CLASS-A", "Standard lot"),
            ("CLASS-B", "Special lot")
        ]
        cursor.executemany(
            "INSERT INTO lot_class (class_code, description) VALUES (?, ?)",
            lot_classes
        )

        materials = [
            ("MAT-001", "Active ingredient"),
            ("MAT-002", "Binder")
        ]
        cursor.executemany(
            "INSERT INTO material (material_code, description) VALUES (?, ?)",
            materials
        )

        lots = [
            ("LOT-1001", 1, 1, "2024-01-01", "2025-01-01", 1000),
            ("LOT-1002", 2, 2, "2024-02-15", "2025-02-15", 500)
        ]
        cursor.executemany(
            "INSERT INTO lot (lot_number, lot_class_id, material_id, manufacture_date, expiry_date, quantity) VALUES (?, ?, ?, ?, ?, ?)",
            lots
        )

        batches = [
            ("BAT-001", 1, "2024-01-02", "2024-01-10", "COMPLETED", 1000),
            ("BAT-002", 2, "2024-02-16", "2024-02-25", "IN_PROCESS", 500)
        ]
        cursor.executemany(
            "INSERT INTO batch (batch_number, lot_id, start_date, end_date, status, quantity_produced) VALUES (?, ?, ?, ?, ?, ?)",
            batches
        )

        batch_steps = [
            (1, 1, "Weighing", "Operator A", "2024-01-03"),
            (1, 2, "Mixing", "Operator B", "2024-01-05"),
            (2, 1, "Weighing", "Operator A", "2024-02-17")
        ]
        cursor.executemany(
            "INSERT INTO batch_step (batch_id, step_number, description, operator, completion_date) VALUES (?, ?, ?, ?, ?)",
            batch_steps
        )

        containers = [
            (1, "CONT-001", "Warehouse A", 500, "FILLED"),
            (1, "CONT-002", "Warehouse A", 500, "FILLED"),
            (2, "CONT-003", "Warehouse B", 500, "NEW")
        ]
        cursor.executemany(
            "INSERT INTO container (batch_id, container_id, location, quantity, status) VALUES (?, ?, ?, ?, ?)",
            containers
        )
    
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

class RowIn(BaseModel):
    data: Dict[str, Any]

class BusinessKey(BaseModel):
    key: str
    value: Any

@app.get("/schema-config")
def get_schema_cfg(): 
    return schema_cfg

@app.get("/ui-config")
def get_ui_cfg(): 
    return ui_cfg

@app.get("/business-keys/{table}")
def get_business_keys(table: str, conn: sqlite3.Connection = Depends(get_db)):
    """Get all available business keys for a table"""
    if table not in schema_cfg["tables"]:
        raise HTTPException(404, f"Unknown table {table}")
    
    # Get business key columns
    business_keys = schema_cfg["tables"][table]["businessKeys"]
    if not business_keys:
        return []
    
    # For simplicity, we'll just handle the first business key
    primary_key = business_keys[0]
    
    cursor = conn.cursor()
    cursor.execute(f"SELECT id, {primary_key} FROM {table}")
    results = cursor.fetchall()

    # Ensure we return clean values and ignore NULL values
    formatted_results = []
    for row in results:
        value = row[1]
        if value is None:
            continue
        # Convert complex values to string to avoid [object Object] issues
        if isinstance(value, (dict, list)):
            value = json.dumps(value)
        formatted_results.append({"id": row[0], "value": str(value)})
    
    return formatted_results

@app.get("/related-business-keys/{table}/{parent_table}/{parent_id}")
def get_related_business_keys(
    table: str, 
    parent_table: str, 
    parent_id: int, 
    conn: sqlite3.Connection = Depends(get_db)
):
    """Get business keys related to a parent record (for 'many' relationships)"""
    if table not in schema_cfg["tables"]:
        raise HTTPException(404, f"Unknown table {table}")
    
    if parent_table not in schema_cfg["tables"]:
        raise HTTPException(404, f"Unknown parent table {parent_table}")
    
    # Check for relationship definition
    relationships = schema_cfg["tables"][table].get("relationships", {})
    parent_rel = None
    parent_key = None
    
    for rel_name, rel_data in relationships.items():
        if rel_data["parentTable"] == parent_table:
            parent_rel = rel_data
            parent_key = rel_data["parentKey"]
            break
    
    if not parent_rel or not parent_key:
        raise HTTPException(404, f"No relationship found from {table} to {parent_table}")
    
    # Get business key columns
    business_keys = schema_cfg["tables"][table]["businessKeys"]
    if not business_keys:
        return []
    
    # For simplicity, we'll just handle the first business key
    primary_key = business_keys[0]
    
    cursor = conn.cursor()
    
    # Query for related records
    cursor.execute(
        f'SELECT id, {primary_key} FROM {table} WHERE {parent_key} = ?',
        (parent_id,)
    )
    results = cursor.fetchall()

    # Ensure we return clean values and ignore NULL values
    formatted_results = []
    for row in results:
        value = row[1]
        if value is None:
            continue
        # Convert complex values to string to avoid [object Object] issues
        if isinstance(value, (dict, list)):
            value = json.dumps(value)
        formatted_results.append({"id": row[0], "value": str(value)})
    
    return formatted_results

@app.get("/related-data/{table}/{key_column}/{key_value}")
def get_related_data(
    table: str, 
    key_column: str, 
    key_value: str, 
    conn: sqlite3.Connection = Depends(get_db)
):
    """Get data for a record based on business key"""
    if table not in schema_cfg["tables"]:
        raise HTTPException(404, f"Unknown table {table}")
    
    cursor = conn.cursor()
    # Get schema columns for this table
    columns = schema_cfg["tables"][table]["columns"] + schema_cfg["tables"][table]["businessKeys"]
    
    # Build query to get data by business key
    query = f"SELECT id, {', '.join(columns)} FROM {table} WHERE {key_column} = ?"
    cursor.execute(query, (key_value,))
    result = cursor.fetchone()
    
    if not result:
        raise HTTPException(404, f"No record found with {key_column}={key_value}")
    
    # Convert to dict
    data = dict(result)
    return data

@app.post("/submit/{table}")
def submit(table: str, payload: RowIn, conn: sqlite3.Connection = Depends(get_db)):
    """Create or update a record"""
    if table not in schema_cfg["tables"]:
        raise HTTPException(404, f"Unknown table {table}")
    
    cursor = conn.cursor()
    row = payload.data.copy()
    
    # Check if we're updating by business key
    business_keys = schema_cfg["tables"][table]["businessKeys"]
    bk_exists = False
    
    if all(bk in row for bk in business_keys):
        # Check if this business key combination already exists
        where_clauses = [f"{bk} = ?" for bk in business_keys]
        query = f"SELECT id FROM {table} WHERE {' AND '.join(where_clauses)}"
        
        # Ensure we're passing primitive values, not complex objects
        param_values = []
        for bk in business_keys:
            value = row[bk]
            # Convert to string if it's not a primitive type
            if isinstance(value, (dict, list)):
                value = str(value)
            param_values.append(value)
            
        cursor.execute(query, param_values)
        existing = cursor.fetchone()
        
        if existing:
            # Update existing record
            pk = existing[0]
            bk_exists = True
            
            # Prepare update
            cols = [c for c in row.keys() if c != "id" and c not in business_keys]
            if cols:
                set_clause = ", ".join([f"{col} = ?" for col in cols])
                
                # Ensure we're passing primitive values, not complex objects
                param_values = []
                for col in cols:
                    value = row[col]
                    # Convert to string if it's not a primitive type
                    if isinstance(value, (dict, list)):
                        value = str(value)
                    param_values.append(value)
                
                query = f"UPDATE {table} SET {set_clause} WHERE id = ?"
                cursor.execute(query, param_values + [pk])
                conn.commit()
    
    if not bk_exists:
        # Insert new record
        cols = list(row.keys())
        placeholders = ", ".join(["?"] * len(cols))
        query = f"INSERT INTO {table} ({', '.join(cols)}) VALUES ({placeholders})"
        
        # Ensure we're passing primitive values, not complex objects
        param_values = []
        for col in cols:
            value = row[col]
            # Convert to string if it's not a primitive type
            if isinstance(value, (dict, list)):
                value = str(value)
            param_values.append(value)
            
        cursor.execute(query, param_values)
        pk = cursor.lastrowid
        conn.commit()
    
    return {"surrogatePK": pk}

@app.get("/rows/{table}")
def get_rows(
    table: str,
    parent_table: Optional[str] = None,
    parent_id: Optional[int] = None,
    conn: sqlite3.Connection = Depends(get_db),
):
    """Return rows for a table. Optionally filter by parent relationship."""
    if table not in schema_cfg["tables"]:
        raise HTTPException(404, f"Unknown table {table}")

    meta = schema_cfg["tables"][table]
    columns: List[str] = (
        meta.get("businessKeys", [])
        + meta.get("columns", [])
        + list(meta.get("foreignKeys", {}).keys())
    )
    # remove duplicates while preserving order
    seen = set()
    cols = []
    for c in columns:
        if c not in seen:
            seen.add(c)
            cols.append(c)

    cursor = conn.cursor()

    if parent_table and parent_id is not None:
        fk_col = None
        for col, ref_tbl in meta.get("foreignKeys", {}).items():
            if ref_tbl == parent_table:
                fk_col = col
                break
        if not fk_col:
            raise HTTPException(400, f"No FK from {table} to {parent_table}")
        query = f"SELECT id, {', '.join(cols)} FROM {table} WHERE {fk_col} = ?"
        cursor.execute(query, (parent_id,))
    else:
        query = f"SELECT id, {', '.join(cols)} FROM {table}"
        cursor.execute(query)

    return [dict(row) for row in cursor.fetchall()]
