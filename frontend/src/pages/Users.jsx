import { useEffect, useState } from "react";
import { ShieldCheck, Users as UsersIcon } from "lucide-react";

import api, { getErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";

import { Select } from "../components/ui/Field";
import {
  Banner,
  EmptyState,
  ErrorState,
  SkeletonRows,
} from "../components/ui/Feedback";


const roles = [
  "admin",
  "agent",
  "customer",
];


export default function Users() {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [success, setSuccess] = useState("");


  /* ======================================================
     LOAD USERS
     ====================================================== */

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/users");

      setUsers(response.data?.data || []);
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Could not load users."
        )
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    load();
  }, []);


  /* ======================================================
     CHANGE ROLE
     ====================================================== */

  const changeRole = async (userId, role) => {
    setSavingId(userId);
    setError("");
    setSuccess("");

    try {
      await api.patch(
        `/users/${userId}/role`,
        { role }
      );

      setUsers((current) =>
        current.map((item) =>
          item._id === userId
            ? { ...item, role }
            : item
        )
      );

      setSuccess(
        "User role updated successfully."
      );
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Could not update user role."
        )
      );
    } finally {
      setSavingId(null);
    }
  };


  /* ======================================================
     ADMIN ONLY
     ====================================================== */

  if (user?.role !== "admin") {
    return (
      <div className="page">

        <ErrorState
          message="You do not have permission to manage users."
        />

      </div>
    );
  }


  /* ======================================================
     RENDER
     ====================================================== */

  return (
    <div className="page">

      {/* ==================================================
          HEADER
          ================================================== */}

      <header className="page-header">

        <div>

          <h1 className="page-title">
            Users
          </h1>

          <p className="page-subtitle">
            Manage CRM users and assign their
            access roles.
          </p>

        </div>

      </header>


      {/* ==================================================
          SUCCESS / ERROR
          ================================================== */}

      {success && (
        <Banner>
          <ShieldCheck size={16} />
          {success}
        </Banner>
      )}

      {error && (
        <div style={{ marginTop: 12 }}>
          <Banner>
            {error}
          </Banner>
        </div>
      )}


      {/* ==================================================
          USER TABLE
          ================================================== */}

      <section
        className="card"
        style={{ marginTop: 18 }}
      >

        {loading ? (

          <SkeletonRows count={5} />

        ) : error && users.length === 0 ? (

          <ErrorState
            message={error}
            onRetry={load}
          />

        ) : users.length === 0 ? (

          <EmptyState
            icon={UsersIcon}
            title="No users found"
            description="There are no CRM users to manage yet."
          />

        ) : (

          <div className="table-wrap">

            <table>

              <thead>

                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created</th>
                </tr>

              </thead>


              <tbody>

                {users.map((item) => (

                  <tr key={item._id}>

                    {/* User */}

                    <td>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >

                        <div className="avatar">
                          {item.name
                            ?.charAt(0)
                            .toUpperCase() || "U"}
                        </div>

                        <strong>
                          {item.name}
                        </strong>

                      </div>

                    </td>


                    {/* Email */}

                    <td>
                      {item.email}
                    </td>


                    {/* Role */}

                    <td>

                      <Select
                        id={`role-${item._id}`}
                        label={`Role for ${item.name}`}
                        hideLabel
                        value={
                          item.role ||
                          "customer"
                        }
                        onChange={(event) =>
                          changeRole(
                            item._id,
                            event.target.value
                          )
                        }
                        disabled={
                          savingId === item._id
                        }
                      >

                        {roles.map((role) => (

                          <option
                            key={role}
                            value={role}
                          >
                            {role
                              .charAt(0)
                              .toUpperCase() +
                              role.slice(1)}
                          </option>

                        ))}

                      </Select>

                      {savingId === item._id && (
                        <div
                          className="item-meta"
                          style={{
                            marginTop: 4,
                          }}
                        >
                          Saving...
                        </div>
                      )}

                    </td>


                    {/* Created */}

                    <td>
                      {item.createdAt
                        ? new Date(
                            item.createdAt
                          ).toLocaleDateString()
                        : "—"}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </section>

    </div>
  );
}