/components/MultiStepForm.tsx
import { useMemo, useState } from 'react';
import RenderSection from './RenderSection';
import { SchemaConfig, UiConfig, ScreenSpec, SectionSpec } from '../types';

interface Props {
  schemaCfg: SchemaConfig;
  uiCfg: UiConfig;
}

export default function MultiStepForm({ schemaCfg, uiCfg }: Props) {
  const [fkContext, setFkContext] = useState<Record<string, number>>({});
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
    }[] = [];
    
    // Follow the sequence defined in schema_config
    schemaCfg.sequence.forEach((tableName) => {
      // Find the corresponding screen in UI config
      const screenIdx = uiCfg.screens.findIndex(screen => screen.table === tableName);
      if (screenIdx === -1) return;
      
      const screen = uiCfg.screens[screenIdx];
      
      // Add each section from the screen
      screen.sections.forEach((section: SectionSpec, secIdx: number) => {
        // Check if this is a business key section using the flag
        const isBusinessKeySection = section.isBusinessKeySection === true;
        
        list.push({
          id: `${screen.table}_${secIdx}`,
          screenIdx,
          sectionIdx: secIdx,
          title: section.title,
          table: screen.table,
          requiresBusinessKey: isBusinessKeySection
        });
      });
    });
    
    return list;
  }, [uiCfg, schemaCfg.sequence]);

  // Handle completion of a section
  const handleDone = (tbl: string, pk: number, sectionId: string) => {
    // Update foreign key context with the new primary key
    setFkContext((prev) => ({ ...prev, [tbl]: pk }));
    
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
    
    // A step is visible if:
    // 1. It's a business key section of a table that's first in sequence
    // 2. OR the business key section of its table is already completed
    // 3. OR the previous step in the same screen is completed
    const step = steps[idx];
    const prevStep = steps[idx - 1];
    
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
      <pre style={{ padding: 24 }}>
        Done! {JSON.stringify(fkContext, null, 2)}
      </pre>
    );

  // Filter steps to show only those that should be visible
  const visibleSteps = steps.filter((_, idx) => isStepVisible(idx) || idx <= stepIdx);

  return (
    <main>
      <div className="form-header">
        <ol className="steps">
          {steps.map((s, idx) => (
            <li
              key={s.id}
              className={
                completedSteps.has(s.id) 
                  ? editingStep === s.id ? 'done editing' : 'done' 
                  : idx === stepIdx 
                    ? 'current' 
                    : ''
              }
              onClick={() => completedSteps.has(s.id) && handleGoToStep(s.id, idx)}
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
      </div>

      {visibleSteps.map((s) => {
        const screen = uiCfg.screens[s.screenIdx];
        const isCompleted = completedSteps.has(s.id);
        const isCurrent = s.id === steps[stepIdx]?.id;
        const isEditing = editingStep === s.id;
        
        return (
          <div key={s.id} className={isCompleted && !isEditing ? 'completed-section' : ''}>
            <h2>{screen.title}</h2>
            <RenderSection
              spec={screen.sections[s.sectionIdx]}
              table={screen.table}
              schemaTables={schemaCfg.tables}
              fkContext={fkContext}
              onDone={(tbl, pk) => handleDone(tbl, pk, s.id)}
              disabled={isCompleted && !isEditing && !isCurrent}
            />
          </div>
        );
      })}
    </main>
  );
}

//components/RenderSection.tsx
import {
    useForm,
    SubmitHandler,
    UseFormRegister,
    useFieldArray,
    Controller,
  } from 'react-hook-form';
  import { useState, useEffect } from 'react';
  
  import {
    SectionSpec,
    NestedRepeatSpec,
    TableMeta,
    FieldSpec,
    BusinessKeyOption,
  } from '../types';
  import { submitRow, getBusinessKeys, getRelatedData, getRelatedBusinessKeys } from '../api';
  
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
      } = useForm<Record<string, unknown>>();
  
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
                  />
                );
              })}
  
              {!disabled && !savedData && (
                <button 
                  className="btn btn-primary" 
                  type="submit" 
                  disabled={loading || disabled}
                >
                  {loading ? 'Saving...' : spec.nested || !spec.isBusinessKeySection ? 'Next' : 'Save'}
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
              onDone={handleNestedDone}
              disabled={disabled}
            />
          )}
        </section>
      );
    }
  
    /* ───────────────────── repeat (array‑of‑rows) section ─────────────────── */
    const [savedRows, setSavedRows] = useState<Record<string, unknown>[]>([]);
    const { 
      control, 
      register, 
      handleSubmit, 
      formState: { errors }, 
      reset,
      setValue 
    } = useForm<{
      rows: Record<string, unknown>[];
    }>({ defaultValues: { rows: [] } });
    const { fields, append, remove } = useFieldArray({ control, name: 'rows' });
  
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
          setSavedRows(prev => [...prev, { ...row, id: surrogatePK }]);
          
          // Remove the form row after saving
          remove(idx);
          
          // Don't call onDone here - we only complete the parent form
          // when the user explicitly clicks a "Complete" button
        } catch (err) {
          setError(`Error saving row: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
          setLoading(false);
        }
      };
  
    // Complete the entire repeatable section
    const completeSection = () => {
      if (savedRows.length > 0) {
        // We use the table of the parent section, not the repeatable section's table
        onDone?.(table, fkContext[table]);
      } else {
        setError("Please add at least one row before completing");
      }
    };
  
    const inner = spec.sections[0]; // simplified: one section description
  
    return (
      <section className={`section ${disabled ? 'disabled-section' : ''}`}>
        <h3>{inner.title}</h3>
        
        {error && <div className="error-message">{error}</div>}
  
        {/* Display saved rows */}
        {savedRows.length > 0 && (
          <div className="saved-rows">
            <h4>Saved Items</h4>
            {savedRows.map((row, idx) => (
              <div key={idx} className="saved-row">
                {inner.fields?.map((f) => (
                  <div key={f.column} className="field-value">
                    <strong>{f.column}:</strong> {String(row[f.column] || '')}
                  </div>
                ))}
              </div>
            ))}
          </div>
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
              
              {savedRows.length > 0 && (
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
    fkContext
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
    
    const manyRelationship = getManyRelationship();
    
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
    const handleBusinessKeySelect = async (event: React.ChangeEvent<HTMLSelectElement>) => {
      const keyValue = event.target.value;
      if (!keyValue || !isBusinessKey) return;
      
      try {
        setLoading(true);
        setLoadError(null);
        
        // Get related data based on the selected business key
        const data = await getRelatedData(table, f.column, keyValue);
        
        // Set form values for all fields from the related data
        Object.entries(data).forEach(([key, value]) => {
          // Don't set the ID or the business key itself (already set)
          if (key !== 'id' && key !== f.column) {
            setValue(path.split('.')[0] + '.' + key, value);
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
    const isBusinessKeyDropdown = isBusinessKey && businessKeyOptions.length > 0;
  
    return (
      <div className={`field ${error || loadError ? 'has-error' : ''}`}>
        <label>{f.column}</label>
  
        {isBusinessKeyDropdown ? (
          // Business key dropdown with options
          <div className="business-key-select">
            <select 
              {...register(path)}
              disabled={disabled || loading}
              onChange={handleBusinessKeySelect}
            >
              <option value="">Select existing {f.column}...</option>
              {businessKeyOptions.map((option) => (
                <option key={option.id} value={typeof option.value === 'string' ? option.value : String(option.id)}>
                  {typeof option.value === 'string' ? option.value : 
                   option.value && typeof option.value === 'object' ? 
                   JSON.stringify(option.value).substring(0, 50) : String(option.value)}
                </option>
              ))}
            </select>
            {loading && <span className="loading-indicator">Loading...</span>}
            <div className="new-key-input">
              <p className="or-divider">or enter new</p>
              <input 
                type={f.widget} 
                placeholder={`New ${f.column}`}
                {...register(path)}
                disabled={disabled || loading}
              />
            </div>
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

  //api.ts
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

//App.tsx
import { useEffect, useState } from 'react';
import { getSchemaCfg, getUiCfg } from './api';
import { SchemaConfig, UiConfig } from './types';
import MultiStepForm from './components/MultiStepForm';

export default function App() {
  const [schemaCfg, setSchemaCfg] = useState<SchemaConfig | undefined>(undefined);
  const [uiCfg, setUiCfg] = useState<UiConfig | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Render the multi-step form with loaded configurations
  return <MultiStepForm schemaCfg={schemaCfg} uiCfg={uiCfg} />;
}


//main.ts
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  React.createElement(React.StrictMode, null, React.createElement(App))
);

//styles.css
/* Form header and navigation */
.form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }
  
  /* Navigation steps */
  .steps {
    list-style: none;
    padding: 0;
    display: flex;
    gap: 8px;
    margin: 0;
    flex-grow: 1;
  }
  
  .back-button {
    white-space: nowrap;
    margin-left: 16px;
  }
  .steps li {
    flex: 1;
    padding-bottom: 4px;
    text-align: center;
    border-bottom: 2px solid #e1e1e1;
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
  .business-key-select select {
    width: 100%;
    margin-bottom: 8px;
  }
  .business-key-select .new-key-input {
    margin-top: 12px;
  }
  .business-key-select .or-divider {
    font-size: 12px;
    color: #666;
    text-align: center;
    margin: 8px 0;
    position: relative;
  }
  .business-key-select .or-divider:before,
  .business-key-select .or-divider:after {
    content: "";
    position: absolute;
    height: 1px;
    background: #e5e7eb;
    top: 50%;
    width: 40%;
  }
  .business-key-select .or-divider:before {
    left: 0;
  }
  .business-key-select .or-divider:after {
    right: 0;
  }
  .loading-indicator {
    display: inline-block;
    font-size: 12px;
    color: #2563eb;
    margin-left: 8px;
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
