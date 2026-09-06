import { useEffect, useState } from "react";
import {
  Activity,
  Mail,
  Phone,
  CalendarDays,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";

import api, { getErrorMessage } from "../services/api";

import { Button } from "../components/ui/Button";
import { Select, TextArea } from "../components/ui/Field";

import {
  Banner,
  EmptyState,
  ErrorState,
  SkeletonRows,
} from "../components/ui/Feedback";

import { StatusBadge } from "../components/ui/StatusBadge";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";


/* =========================================================
   ACTIVITY ICONS
   ========================================================= */

const activityIcons = {
  call: Phone,
  email: Mail,
  meeting: CalendarDays,
  note: FileText,
  "follow-up": Activity,
};


/* =========================================================
   EMPTY FORM
   ========================================================= */

const initialForm = {
  customer: "",
  case: "",
  type: "call",
  description: "",
};


/* =========================================================
   ACTIVITIES PAGE
   ========================================================= */

export default function Activities() {
  const [activities, setActivities] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cases, setCases] = useState([]);

  const [form, setForm] = useState(initialForm);

  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [activityToDelete, setActivityToDelete] = useState(null);


  /* =======================================================
     LOAD DATA
     ======================================================= */

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        activitiesResponse,
        customersResponse,
        casesResponse,
      ] = await Promise.all([
        api.get("/activities"),
        api.get("/customers"),
        api.get("/cases"),
      ]);

      setActivities(
        activitiesResponse.data?.data || []
      );

      setCustomers(
        customersResponse.data?.data || []
      );

      setCases(
        casesResponse.data?.data || []
      );
    } catch (error) {
      setError(
        getErrorMessage(
          error,
          "Could not load activities."
        )
      );
    } finally {
      setLoading(false);
    }
  };


  /* =======================================================
     INITIAL LOAD
     ======================================================= */

  useEffect(() => {
    loadData();
  }, []);


  /* =======================================================
     OPEN CREATE FORM
     ======================================================= */

  const openCreateForm = () => {
    setForm({
      ...initialForm,
      customer: customers[0]?._id || "",
    });

    setFormError("");
    setShowForm(true);
  };


  /* =======================================================
     CLOSE FORM
     ======================================================= */

  const closeForm = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    setForm(initialForm);
    setFormError("");
  };


  /* =======================================================
     FORM CHANGE
     ======================================================= */

  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };


  /* =======================================================
     CREATE ACTIVITY
     ======================================================= */

  const submit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setFormError("");

    try {
      if (!form.customer) {
        setFormError("Please select a customer.");
        return;
      }

      if (!form.description.trim()) {
        setFormError("Please enter an activity description.");
        return;
      }

      /*
       * Don't send case: ""
       * Send null when no case is selected.
       */

      const payload = {
        customer: form.customer,
        type: form.type,
        description: form.description.trim(),
        case: form.case || null,
      };

      await api.post("/activities", payload);

      setShowForm(false);
      setForm(initialForm);

      await loadData();
    } catch (error) {
      setFormError(
        getErrorMessage(
          error,
          "Could not create activity."
        )
      );
    } finally {
      setSaving(false);
    }
  };


  /* =======================================================
     DELETE ACTIVITY
     ======================================================= */

  const deleteActivity = async () => {
    if (!activityToDelete?._id) {
      return;
    }

    try {
      await api.delete(
        `/activities/${activityToDelete._id}`
      );

      setActivityToDelete(null);

      await loadData();
    } catch (error) {
      setError(
        getErrorMessage(
          error,
          "Could not delete activity."
        )
      );

      setActivityToDelete(null);
    }
  };


  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="page">

      {/* ===================================================
          PAGE HEADER
          =================================================== */}

      <header className="page-header">

        <div>
          <h1 className="page-title">
            Activities
          </h1>

          <p className="page-subtitle">
            Keep a history of calls, emails, meetings,
            notes, and follow-ups.
          </p>
        </div>

        <Button
          onClick={openCreateForm}
          disabled={customers.length === 0}
        >
          <Plus size={17} />
          Log activity
        </Button>

      </header>


      {/* ===================================================
          CREATE ACTIVITY FORM
          =================================================== */}

      {showForm && (
        <div
          className="card"
          style={{ marginBottom: 18 }}
        >

          <div className="card-header">
            <strong>
              Log customer activity
            </strong>
          </div>


          <div className="card-body">

            {formError && (
              <Banner>
                {formError}
              </Banner>
            )}


            <form
              className="form-grid"
              onSubmit={submit}
            >

              {/* Customer */}

              <Select
                id="activity-customer"
                label="Customer"
                value={form.customer}
                onChange={(event) =>
                  updateForm(
                    "customer",
                    event.target.value
                  )
                }
                required
              >
                <option value="">
                  Select a customer
                </option>

                {customers.map((customer) => (
                  <option
                    key={customer._id}
                    value={customer._id}
                  >
                    {customer.name}
                  </option>
                ))}
              </Select>


              {/* Case */}

              <Select
                id="activity-case"
                label="Related case (optional)"
                value={form.case}
                onChange={(event) =>
                  updateForm(
                    "case",
                    event.target.value
                  )
                }
              >
                <option value="">
                  No case
                </option>

                {cases.map((item) => (
                  <option
                    key={item._id}
                    value={item._id}
                  >
                    {item.title}
                  </option>
                ))}
              </Select>


              {/* Activity type */}

              <Select
                id="activity-type"
                label="Activity type"
                value={form.type}
                onChange={(event) =>
                  updateForm(
                    "type",
                    event.target.value
                  )
                }
              >
                <option value="call">
                  Call
                </option>

                <option value="email">
                  Email
                </option>

                <option value="meeting">
                  Meeting
                </option>

                <option value="note">
                  Note
                </option>

                <option value="follow-up">
                  Follow-up
                </option>
              </Select>


              {/* Description */}

              <div className="form-full">

                <TextArea
                  id="activity-description"
                  label="Description"
                  value={form.description}
                  onChange={(event) =>
                    updateForm(
                      "description",
                      event.target.value
                    )
                  }
                  placeholder="Describe the customer interaction..."
                  required
                />

              </div>


              {/* Actions */}

              <div className="form-actions form-full">

                <Button
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Log activity"}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </Button>

              </div>

            </form>

          </div>

        </div>
      )}


      {/* ===================================================
          LOADING
          =================================================== */}

      {loading && (
        <div className="card">
          <SkeletonRows />
        </div>
      )}


      {/* ===================================================
          ERROR
          =================================================== */}

      {!loading && error && (
        <ErrorState
          message={error}
          onRetry={loadData}
        />
      )}


      {/* ===================================================
          EMPTY
          =================================================== */}

      {!loading &&
        !error &&
        activities.length === 0 && (
          <div className="card">

            <EmptyState
              icon={Activity}
              title="No activities yet"
              description="Log the first customer interaction to build an activity history."
              action={
                customers.length > 0 ? (
                  <Button onClick={openCreateForm}>
                    <Plus size={15} />
                    Log activity
                  </Button>
                ) : null
              }
            />

          </div>
        )}


      {/* ===================================================
          ACTIVITY LIST
          =================================================== */}

      {!loading &&
        !error &&
        activities.length > 0 && (
          <section className="card">

            <ul className="list">

              {activities.map((activity) => {

                const Icon =
                  activityIcons[activity.type] ||
                  Activity;

                return (
                  <li
                    className="list-item"
                    key={activity._id}
                  >

                    {/* Icon */}

                    <div className="avatar">
                      <Icon size={17} />
                    </div>


                    {/* Content */}

                    <div className="item-main">

                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >

                        <span className="item-title">
                          {activity.customer?.name ||
                            "Customer"}
                        </span>

                        <StatusBadge
                          value={activity.type}
                        />

                      </div>


                      {/* Description */}

                      <div className="item-meta">
                        {activity.description}
                      </div>


                      {/* Case */}

                      {activity.case?.title && (
                        <div className="item-meta">
                          Case: {activity.case.title}
                        </div>
                      )}


                      {/* Date */}

                      <div className="item-meta">
                        {activity.createdAt
                          ? new Date(
                              activity.createdAt
                            ).toLocaleString()
                          : ""}
                      </div>

                    </div>


                    {/* Delete */}

                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`Delete activity ${
                        activity.customer?.name ||
                        ""
                      }`}
                      onClick={() =>
                        setActivityToDelete(activity)
                      }
                    >
                      <Trash2 size={16} />
                    </button>

                  </li>
                );
              })}

            </ul>

          </section>
        )}


      {/* ===================================================
          DELETE CONFIRMATION
          =================================================== */}

      <ConfirmDialog
        open={Boolean(activityToDelete)}
        title="Delete activity"
        message="Delete this activity from the customer history?"
        confirmLabel="Delete"
        danger
        onCancel={() =>
          setActivityToDelete(null)
        }
        onConfirm={deleteActivity}
      />

    </div>
  );
}