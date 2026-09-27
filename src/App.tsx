import { useEffect, useState } from "react";
import "./App.css";

type FieldType =
  | "text"
  | "email"
  | "number"
  | "select"
  | "checkbox"
  | "radio"
  | "rating"
  | "date";

type FormField = {
  id: number;
  type: FieldType;
  label: string;
  description: string;
  required: boolean;
  options?: string[];
};

type FormData = {
  title: string;
  description: string;
  fields: FormField[];
};

type ResponseData = {
  id: number;
  submittedAt: string;
  answers: Record<string, string | string[]>;
};

const defaultForm: FormData = {
  title: "Customer feedback",
  description:
    "We'd love to hear what you think about your experience.",
  fields: [
    {
      id: 1,
      type: "text",
      label: "Full name",
      description: "Tell us your name.",
      required: true,
    },
    {
      id: 2,
      type: "email",
      label: "Email address",
      description: "We'll use this to contact you.",
      required: true,
    },
    {
      id: 3,
      type: "rating",
      label: "How would you rate your experience?",
      description: "Choose a rating from 1 to 5.",
      required: false,
    },
  ],
};

const fieldTypes: { type: FieldType; label: string }[] = [
  { type: "text", label: "Short text" },
  { type: "email", label: "Email" },
  { type: "number", label: "Number" },
  { type: "select", label: "Dropdown" },
  { type: "checkbox", label: "Checkboxes" },
  { type: "radio", label: "Multiple choice" },
  { type: "rating", label: "Rating" },
  { type: "date", label: "Date" },
];

function App() {
  const [form, setForm] = useState<FormData>(() => {
    const saved = localStorage.getItem("formcraft-form");

    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return defaultForm;
      }
    }

    return defaultForm;
  });

  const [responses, setResponses] = useState<ResponseData[]>(() => {
    const saved = localStorage.getItem("formcraft-responses");

    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }

    return [];
  });

  const [selectedId, setSelectedId] = useState<number | null>(
    form.fields[0]?.id ?? null
  );

  const [view, setView] = useState<"builder" | "responses">(
    "builder"
  );

  const [preview, setPreview] = useState(false);
  const [published, setPublished] = useState(false);
  const [publicForm, setPublicForm] = useState(false);
  const [selectedResponse, setSelectedResponse] =
    useState<ResponseData | null>(null);

  const [draggedId, setDraggedId] = useState<number | null>(null);

  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] =
    useState(false);

  useEffect(() => {
    localStorage.setItem("formcraft-form", JSON.stringify(form));
  }, [form]);

  useEffect(() => {
    localStorage.setItem(
      "formcraft-responses",
      JSON.stringify(responses)
    );
  }, [responses]);

  const selectedField = form.fields.find(
    (field) => field.id === selectedId
  );

  const updateForm = (updates: Partial<FormData>) => {
    setForm((current) => ({
      ...current,
      ...updates,
    }));
  };

  const addField = (type: FieldType) => {
    const hasOptions =
      type === "select" ||
      type === "checkbox" ||
      type === "radio";

    const newField: FormField = {
      id: Date.now(),
      type,
      label:
        fieldTypes.find((item) => item.type === type)?.label ||
        "New field",
      description: "",
      required: false,
      ...(hasOptions
        ? {
            options: [
              "Option one",
              "Option two",
              "Option three",
            ],
          }
        : {}),
    };

    setForm((current) => ({
      ...current,
      fields: [...current.fields, newField],
    }));

    setSelectedId(newField.id);
  };

  const updateSelected = (updates: Partial<FormField>) => {
    if (selectedId === null) return;

    setForm((current) => ({
      ...current,
      fields: current.fields.map((field) =>
        field.id === selectedId
          ? { ...field, ...updates }
          : field
      ),
    }));
  };

  const deleteSelected = () => {
    if (selectedId === null) return;

    const index = form.fields.findIndex(
      (field) => field.id === selectedId
    );

    const remaining = form.fields.filter(
      (field) => field.id !== selectedId
    );

    setForm((current) => ({
      ...current,
      fields: remaining,
    }));

    const nextField =
      remaining[index] || remaining[index - 1];

    setSelectedId(nextField?.id ?? null);
  };

  const duplicateSelected = () => {
    if (!selectedField) return;

    const duplicate: FormField = {
      ...selectedField,
      id: Date.now(),
      label: `${selectedField.label} copy`,
      options: selectedField.options
        ? [...selectedField.options]
        : undefined,
    };

    const index = form.fields.findIndex(
      (field) => field.id === selectedField.id
    );

    const updatedFields = [...form.fields];

    updatedFields.splice(index + 1, 0, duplicate);

    setForm((current) => ({
      ...current,
      fields: updatedFields,
    }));

    setSelectedId(duplicate.id);
  };

  const moveField = (fromId: number, toId: number) => {
    if (fromId === toId) return;

    const fields = [...form.fields];

    const fromIndex = fields.findIndex(
      (field) => field.id === fromId
    );

    const toIndex = fields.findIndex(
      (field) => field.id === toId
    );

    if (fromIndex === -1 || toIndex === -1) return;

    const [moved] = fields.splice(fromIndex, 1);

    fields.splice(toIndex, 0, moved);

    setForm((current) => ({
      ...current,
      fields,
    }));
  };

  const updateOption = (index: number, value: string) => {
    if (!selectedField?.options) return;

    const options = [...selectedField.options];

    options[index] = value;

    updateSelected({ options });
  };

  const addOption = () => {
    if (!selectedField) return;

    updateSelected({
      options: [
        ...(selectedField.options || []),
        "New option",
      ],
    });
  };

  const removeOption = (index: number) => {
    if (!selectedField?.options) return;

    updateSelected({
      options: selectedField.options.filter(
        (_, optionIndex) => optionIndex !== index
      ),
    });
  };

  const submitResponse = (
    answers: Record<string, string | string[]>,
    showResponses = true
  ) => {
    const missing = form.fields.find((field) => {
      if (!field.required) return false;

      const answer = answers[String(field.id)];

      if (Array.isArray(answer)) {
        return answer.length === 0;
      }

      return !answer || answer.trim() === "";
    });

    if (missing) {
      alert(`Please answer: ${missing.label}`);
      return;
    }

    const response: ResponseData = {
      id: Date.now(),
      submittedAt: new Date().toISOString(),
      answers,
    };

    setResponses((current) => [
      response,
      ...current,
    ]);

    if (showResponses) {
      setPreview(false);
      setView("responses");
    }
  };

  const deleteResponse = (id: number) => {
    setResponses((current) =>
      current.filter((response) => response.id !== id)
    );

    if (selectedResponse?.id === id) {
      setSelectedResponse(null);
    }
  };

  const resetForm = () => {
    if (
      !confirm(
        "Reset the form and remove all saved responses?"
      )
    ) {
      return;
    }

    setForm(defaultForm);
    setResponses([]);
    setSelectedId(defaultForm.fields[0].id);
    setSelectedResponse(null);
    setPublished(false);
    setView("builder");
  };

  if (publicForm) {
    return (
      <PublicForm
        form={form}
        onSubmit={(answers) => submitResponse(answers, false)}
        onBack={() => setPublicForm(false)}
      />
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">F</div>
          <span>Formcraft</span>
        </div>

        <div className="form-title">
          <span>{form.title}</span>
          <span className="saved-dot">●</span>
        </div>

        <div className="top-actions">
          {view === "builder" ? (
            <>
              <button
                className="ghost-button"
                onClick={() => setPreview(true)}
              >
                Preview
              </button>

              <button
                className={`publish-button ${
                  published ? "published" : ""
                }`}
                onClick={() => {
                  setPublished(true);
                  setPublicForm(true);
                }}
              >
                {published ? "Published" : "Publish"}
              </button>
            </>
          ) : (
            <button
              className="ghost-button"
              onClick={() => setView("builder")}
            >
              Back to builder
            </button>
          )}

          <div className="avatar">N</div>
        </div>
      </header>

      {view === "builder" ? (
        <Builder
          form={form}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          selectedField={selectedField}
          editingTitle={editingTitle}
          setEditingTitle={setEditingTitle}
          editingDescription={editingDescription}
          setEditingDescription={setEditingDescription}
          draggedId={draggedId}
          setDraggedId={setDraggedId}
          addField={addField}
          updateForm={updateForm}
          updateSelected={updateSelected}
          deleteSelected={deleteSelected}
          duplicateSelected={duplicateSelected}
          moveField={moveField}
          updateOption={updateOption}
          addOption={addOption}
          removeOption={removeOption}
          openResponses={() => setView("responses")}
          resetForm={resetForm}
        />
      ) : (
        <ResponsesView
          form={form}
          responses={responses}
          selectedResponse={selectedResponse}
          setSelectedResponse={setSelectedResponse}
          deleteResponse={deleteResponse}
        />
      )}

      {preview && (
        <Preview
          form={form}
          onClose={() => setPreview(false)}
          onSubmit={submitResponse}
        />
      )}
    </div>
  );
}

function Builder({
  form,
  selectedId,
  setSelectedId,
  selectedField,
  editingTitle,
  setEditingTitle,
  editingDescription,
  setEditingDescription,
  draggedId,
  setDraggedId,
  addField,
  updateForm,
  updateSelected,
  deleteSelected,
  duplicateSelected,
  moveField,
  updateOption,
  addOption,
  removeOption,
  openResponses,
  resetForm,
}: any) {
  return (
    <div className="workspace">
      <aside className="sidebar">
        <div className="sidebar-heading">BUILD</div>

        <div className="field-list">
          {fieldTypes.map((item) => (
            <button
              key={item.type}
              className="field-option"
              onClick={() => addField(item.type)}
            >
              <span className="field-icon">
                {item.type === "text" && "T"}
                {item.type === "email" && "@"}
                {item.type === "number" && "#"}
                {item.type === "select" && "▾"}
                {item.type === "checkbox" && "☑"}
                {item.type === "radio" && "◉"}
                {item.type === "rating" && "☆"}
                {item.type === "date" && "□"}
              </span>

              <span>{item.label}</span>
              <span className="add-symbol">+</span>
            </button>
          ))}
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-heading">FORM</div>

          <button
            className="side-link"
            onClick={openResponses}
          >
            Responses
            {form.fields.length >= 0 && (
              <span style={{ float: "right" }}>
                {/* response count is displayed in the responses page */}
              </span>
            )}
          </button>

          <button className="side-link">
            Settings
          </button>

          <button
            className="side-link"
            onClick={resetForm}
          >
            Reset example
          </button>
        </div>
      </aside>

      <main className="canvas-area">
        <div className="canvas-toolbar">
          <div>
            <span className="canvas-label">
              FORM BUILDER
            </span>

            <span className="field-count">
              {form.fields.length}{" "}
              {form.fields.length === 1
                ? "field"
                : "fields"}
            </span>
          </div>

          <div className="toolbar-right">
            <span className="status">
              <span className="status-dot" />
              Saved locally
            </span>
          </div>
        </div>

        <div className="form-canvas">
          <div className="form-paper">
            <div className="form-header">
              {editingTitle ? (
                <input
                  className="title-editor"
                  value={form.title}
                  autoFocus
                  onChange={(event) =>
                    updateForm({
                      title: event.target.value,
                    })
                  }
                  onBlur={() => setEditingTitle(false)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      setEditingTitle(false);
                    }
                  }}
                />
              ) : (
                <div
                  className="editable-title"
                  onClick={() => setEditingTitle(true)}
                >
                  {form.title}
                </div>
              )}

              {editingDescription ? (
                <textarea
                  className="description-editor"
                  value={form.description}
                  autoFocus
                  onChange={(event) =>
                    updateForm({
                      description: event.target.value,
                    })
                  }
                  onBlur={() =>
                    setEditingDescription(false)
                  }
                />
              ) : (
                <div
                  className="editable-description"
                  onClick={() =>
                    setEditingDescription(true)
                  }
                >
                  {form.description ||
                    "Click to add a description."}
                </div>
              )}
            </div>

            <div className="fields">
              {form.fields.map(
                (field: FormField, index: number) => (
                  <div
                    key={field.id}
                    draggable
                    onDragStart={() =>
                      setDraggedId(field.id)
                    }
                    onDragOver={(event) =>
                      event.preventDefault()
                    }
                    onDrop={() => {
                      if (draggedId !== null) {
                        moveField(
                          draggedId,
                          field.id
                        );
                      }

                      setDraggedId(null);
                    }}
                    onDragEnd={() =>
                      setDraggedId(null)
                    }
                    className={`field-card ${
                      selectedId === field.id
                        ? "selected"
                        : ""
                    } ${
                      draggedId === field.id
                        ? "dragging"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedId(field.id)
                    }
                  >
                    <div
                      className="drag-handle"
                      title="Drag to reorder"
                    >
                      ⋮⋮
                    </div>

                    <div className="field-number">
                      {String(index + 1).padStart(
                        2,
                        "0"
                      )}
                    </div>

                    <div className="field-content">
                      <div className="field-label">
                        {field.label}

                        {field.required && (
                          <span className="required">
                            *
                          </span>
                        )}
                      </div>

                      {field.description && (
                        <div className="field-description">
                          {field.description}
                        </div>
                      )}

                      <FieldPreview field={field} />
                    </div>

                    {selectedId === field.id && (
                      <div className="selected-indicator">
                        Editing
                      </div>
                    )}
                  </div>
                )
              )}
            </div>

            {form.fields.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">+</div>
                <h3>Your form is empty</h3>
                <p>
                  Choose a field from the left to start
                  building.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <aside className="inspector">
        <div className="inspector-header">
          <div>
            <div className="inspector-kicker">
              FIELD SETTINGS
            </div>

            <h2>
              {selectedField?.label ||
                "No field selected"}
            </h2>
          </div>
        </div>

        {selectedField ? (
          <div className="settings">
            <label className="setting">
              <span>Label</span>

              <input
                value={selectedField.label}
                onChange={(event) =>
                  updateSelected({
                    label: event.target.value,
                  })
                }
              />
            </label>

            <label className="setting">
              <span>Description</span>

              <textarea
                value={selectedField.description}
                placeholder="Optional description"
                onChange={(event) =>
                  updateSelected({
                    description:
                      event.target.value,
                  })
                }
              />
            </label>

            <label className="toggle-row">
              <span>
                <strong>Required</strong>
                <small>
                  Users must answer this field.
                </small>
              </span>

              <input
                type="checkbox"
                checked={selectedField.required}
                onChange={(event) =>
                  updateSelected({
                    required:
                      event.target.checked,
                  })
                }
              />
            </label>

            <div className="setting">
              <span>Field type</span>

              <div className="type-display">
                {fieldTypes.find(
                  (item) =>
                    item.type === selectedField.type
                )?.label ||
                  selectedField.type}
              </div>
            </div>

            {selectedField.options && (
              <div className="setting">
                <span>Options</span>

                <div className="options-editor">
                  {selectedField.options.map(
                    (
                      option: string,
                      index: number
                    ) => (
                      <div
                        className="option-row"
                        key={`${selectedField.id}-${index}`}
                      >
                        <input
                          value={option}
                          onChange={(event) =>
                            updateOption(
                              index,
                              event.target.value
                            )
                          }
                        />

                        <button
                          onClick={() =>
                            removeOption(index)
                          }
                        >
                          ×
                        </button>
                      </div>
                    )
                  )}

                  <button
                    className="add-option"
                    onClick={addOption}
                  >
                    + Add option
                  </button>
                </div>
              </div>
            )}

            <div className="field-actions">
              <button
                className="duplicate-button"
                onClick={duplicateSelected}
              >
                Duplicate
              </button>

              <button
                className="delete-button"
                onClick={deleteSelected}
              >
                Delete field
              </button>
            </div>
          </div>
        ) : (
          <div className="no-selection">
            Select a field to edit its properties.
          </div>
        )}
      </aside>
    </div>
  );
}

function Preview({
  form,
  onClose,
  onSubmit,
}: {
  form: FormData;
  onClose: () => void;
  onSubmit: (
    answers: Record<string, string | string[]>
  ) => void;
}) {
  const [answers, setAnswers] = useState<
    Record<string, string | string[]>
  >({});

  const updateAnswer = (
    id: number,
    value: string | string[]
  ) => {
    setAnswers((current) => ({
      ...current,
      [String(id)]: value,
    }));
  };

  const toggleCheckbox = (
    id: number,
    option: string
  ) => {
    const key = String(id);

    const current = Array.isArray(answers[key])
      ? (answers[key] as string[])
      : [];

    const next = current.includes(option)
      ? current.filter((item) => item !== option)
      : [...current, option];

    updateAnswer(id, next);
  };

  return (
    <div className="preview-overlay">
      <div className="preview-window">
        <div className="preview-topbar">
          <span>Preview</span>

          <button onClick={onClose}>
            Close
          </button>
        </div>

        <div className="preview-content">
          <div className="preview-form">
            <div className="preview-title">
              {form.title}
            </div>

            <p>{form.description}</p>

            {form.fields.map((field) => (
              <div
                className="preview-field"
                key={field.id}
              >
                <label>
                  {field.label}

                  {field.required && (
                    <span>*</span>
                  )}
                </label>

                <InteractiveField
                  field={field}
                  value={answers[String(field.id)]}
                  onChange={(value) =>
                    updateAnswer(field.id, value)
                  }
                  onCheckboxChange={(option) =>
                    toggleCheckbox(
                      field.id,
                      option
                    )
                  }
                />
              </div>
            ))}

            <button
              className="submit-button"
              onClick={() => onSubmit(answers)}
            >
              Submit response
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InteractiveField({
  field,
  value,
  onChange,
  onCheckboxChange,
}: {
  field: FormField;
  value: string | string[] | undefined;
  onChange: (value: string) => void;
  onCheckboxChange: (option: string) => void;
}) {
  if (
    field.type === "text" ||
    field.type === "email" ||
    field.type === "number"
  ) {
    return (
      <input
        className="preview-input"
        type={
          field.type === "number"
            ? "number"
            : field.type
        }
        placeholder={
          field.type === "email"
            ? "name@example.com"
            : "Type your answer..."
        }
        value={typeof value === "string" ? value : ""}
        onChange={(event) =>
          onChange(event.target.value)
        }
      />
    );
  }

  if (field.type === "date") {
    return (
      <input
        className="preview-input"
        type="date"
        value={typeof value === "string" ? value : ""}
        onChange={(event) =>
          onChange(event.target.value)
        }
      />
    );
  }

  if (field.type === "select") {
    return (
      <select
        className="preview-input"
        value={typeof value === "string" ? value : ""}
        onChange={(event) =>
          onChange(event.target.value)
        }
      >
        <option value="">Select an option</option>

        {field.options?.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "rating") {
    return (
      <div className="rating-preview">
        {[1, 2, 3, 4, 5].map((number) => (
          <button
            key={number}
            className={
              value === String(number)
                ? "rating-selected"
                : ""
            }
            onClick={() =>
              onChange(String(number))
            }
          >
            {number}
          </button>
        ))}
      </div>
    );
  }

  if (
    field.type === "checkbox" ||
    field.type === "radio"
  ) {
    const selected = Array.isArray(value)
      ? value
      : typeof value === "string"
        ? [value]
        : [];

    return (
      <div className="choice-preview">
        {field.options?.map((option) => (
          <label key={option}>
            <input
              type={
                field.type === "checkbox"
                  ? "checkbox"
                  : "radio"
              }
              name={`field-${field.id}`}
              checked={selected.includes(option)}
              onChange={() => {
                if (field.type === "checkbox") {
                  onCheckboxChange(option);
                } else {
                  onChange(option);
                }
              }}
            />

            {option}
          </label>
        ))}
      </div>
    );
  }

  return null;
}

function FieldPreview({
  field,
}: {
  field: FormField;
}) {
  if (
    field.type === "text" ||
    field.type === "email" ||
    field.type === "number"
  ) {
    return (
      <input
        className="preview-input"
        type={
          field.type === "number"
            ? "number"
            : field.type
        }
        placeholder={
          field.type === "email"
            ? "name@example.com"
            : "Type your answer..."
        }
        disabled
      />
    );
  }

  if (field.type === "date") {
    return (
      <input
        className="preview-input"
        type="date"
        disabled
      />
    );
  }

  if (field.type === "select") {
    return (
      <select
        className="preview-input"
        disabled
      >
        <option>Select an option</option>

        {field.options?.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    );
  }

  if (field.type === "rating") {
    return (
      <div className="rating-preview">
        {[1, 2, 3, 4, 5].map((number) => (
          <button key={number} disabled>
            {number}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="choice-preview">
      {field.options?.map((option) => (
        <label key={option}>
          <input
            type={
              field.type === "checkbox"
                ? "checkbox"
                : "radio"
            }
            disabled
          />
          {option}
        </label>
      ))}
    </div>
  );
}

function ResponsesView({
  form,
  responses,
  selectedResponse,
  setSelectedResponse,
  deleteResponse,
}: {
  form: FormData;
  responses: ResponseData[];
  selectedResponse: ResponseData | null;
  setSelectedResponse: (
    response: ResponseData | null
  ) => void;
  deleteResponse: (id: number) => void;
}) {
  if (selectedResponse) {
    return (
      <main className="responses-page">
        <div className="responses-header">
          <div>
            <button
              className="back-link"
              onClick={() =>
                setSelectedResponse(null)
              }
            >
              ← All responses
            </button>

            <div className="responses-kicker">
              RESPONSE
            </div>

            <h1>
              Response #
              {responses.findIndex(
                (item) =>
                  item.id === selectedResponse.id
              ) + 1}
            </h1>
          </div>

          <button
            className="delete-response"
            onClick={() =>
              deleteResponse(selectedResponse.id)
            }
          >
            Delete response
          </button>
        </div>

        <div className="response-meta">
          Submitted{" "}
          {new Date(
            selectedResponse.submittedAt
          ).toLocaleString()}
        </div>

        <div className="response-detail">
          {form.fields.map((field) => {
            const answer =
              selectedResponse.answers[
                String(field.id)
              ];

            return (
              <div
                className="response-answer"
                key={field.id}
              >
                <div className="response-question">
                  {field.label}
                </div>

                <div className="response-value">
                  {Array.isArray(answer)
                    ? answer.join(", ")
                    : answer || "No answer"}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    );
  }

  return (
    <main className="responses-page">
      <div className="responses-header">
        <div>
          <div className="responses-kicker">
            FORM RESPONSES
          </div>

          <h1>{form.title}</h1>

          <p>
            Review and manage responses submitted
            to this form.
          </p>
        </div>

        <div className="response-count-card">
          <strong>{responses.length}</strong>
          <span>
            {responses.length === 1
              ? "response"
              : "responses"}
          </span>
        </div>
      </div>

      {responses.length === 0 ? (
        <div className="responses-empty">
          <div className="empty-icon">○</div>

          <h2>No responses yet</h2>

          <p>
            Open Preview and submit the form to
            create your first response.
          </p>
        </div>
      ) : (
        <div className="response-list">
          {responses.map((response, index) => {
            const firstAnswer =
              form.fields.find(
                (field) =>
                  response.answers[
                    String(field.id)
                  ]
              );

            const previewAnswer = firstAnswer
              ? response.answers[
                  String(firstAnswer.id)
                ]
              : "No answer";

            return (
              <button
                className="response-row"
                key={response.id}
                onClick={() =>
                  setSelectedResponse(response)
                }
              >
                <div className="response-index">
                  {String(
                    responses.length - index
                  ).padStart(2, "0")}
                </div>

                <div className="response-main">
                  <strong>
                    {Array.isArray(previewAnswer)
                      ? previewAnswer.join(", ")
                      : previewAnswer}
                  </strong>

                  <span>
                    {new Date(
                      response.submittedAt
                    ).toLocaleString()}
                  </span>
                </div>

                <span className="response-arrow">
                  →
                </span>
              </button>
            );
          })}
        </div>
      )}
    </main>
  );
}

function PublicForm({
  form,
  onSubmit,
  onBack,
}: {
  form: FormData;
  onSubmit: (
    answers: Record<string, string | string[]>
  ) => void;
  onBack: () => void;
}) {
  const [answers, setAnswers] = useState<
    Record<string, string | string[]>
  >({});

  const [submitted, setSubmitted] = useState(false);

  const updateAnswer = (
    id: number,
    value: string | string[]
  ) => {
    setAnswers((current) => ({
      ...current,
      [String(id)]: value,
    }));
  };

  const toggleCheckbox = (
    id: number,
    option: string
  ) => {
    const key = String(id);

    const current = Array.isArray(answers[key])
      ? (answers[key] as string[])
      : [];

    const next = current.includes(option)
      ? current.filter((item) => item !== option)
      : [...current, option];

    updateAnswer(id, next);
  };

  const handleSubmit = () => {
    const missing = form.fields.find((field) => {
      if (!field.required) return false;

      const answer = answers[String(field.id)];

      if (Array.isArray(answer)) {
        return answer.length === 0;
      }

      return !answer || answer.trim() === "";
    });

    if (missing) {
      alert(`Please answer: ${missing.label}`);
      return;
    }

    onSubmit(answers);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="public-shell">
        <div className="public-success">
          <div className="public-success-mark">✓</div>

          <h1>Thank you.</h1>

          <p>
            Your response has been recorded successfully.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="public-shell">
      <div className="public-topbar">
        <div className="public-brand">
          <div className="brand-mark">F</div>
          <span>Formcraft</span>
        </div>

        <button
          className="public-exit"
          onClick={onBack}
        >
          Exit preview
        </button>
      </div>

      <main className="public-content">
        <div className="public-form">
          <div className="public-header">
            <h1>{form.title}</h1>

            {form.description && (
              <p>{form.description}</p>
            )}
          </div>

          <div className="public-fields">
            {form.fields.map((field) => (
              <div
                className="public-field"
                key={field.id}
              >
                <label>
                  {field.label}

                  {field.required && (
                    <span className="public-required">
                      *
                    </span>
                  )}
                </label>

                {field.description && (
                  <div className="public-description">
                    {field.description}
                  </div>
                )}

                <InteractiveField
                  field={field}
                  value={answers[String(field.id)]}
                  onChange={(value) =>
                    updateAnswer(field.id, value)
                  }
                  onCheckboxChange={(option) =>
                    toggleCheckbox(field.id, option)
                  }
                />
              </div>
            ))}
          </div>

          <button
            className="public-submit"
            onClick={handleSubmit}
          >
            Submit response
          </button>

          <div className="public-footer">
            Powered by Formcraft
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;