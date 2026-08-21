import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Dashboard() {
  const [customers, setCustomers] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
  });

  const navigate = useNavigate();

  // GET all customers
  const getCustomers = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.get("/customers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCustomers(response.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getCustomers();
  }, []);

  // Handle form input
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ADD or UPDATE customer
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      if (editingId) {
        // UPDATE customer
        await api.patch(
          `/customers/${editingId}`,
          formData,
          config
        );

        alert("Customer updated successfully");
      } else {
        // ADD customer
        await api.post(
          "/customers",
          formData,
          config
        );

        alert("Customer added successfully");
      }

      // Clear form
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
      });

      setEditingId(null);

      getCustomers();

    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Operation failed"
      );
    }
  };

  // EDIT customer
  const handleEdit = (customer) => {
    setEditingId(customer._id);

    setFormData({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      company: customer.company || "",
    });
  };

  // DELETE customer
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this customer?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      await api.delete(`/customers/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Customer deleted successfully");

      getCustomers();
    } catch (error) {
      alert("Failed to delete customer");
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setEditingId(null);

    setFormData({
      name: "",
      email: "",
      phone: "",
      company: "",
    });
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Dashboard
          </h1>

          <p className="text-gray-500">
            Manage your customers
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      {/* Add / Update Form */}
      <div className="mb-6 rounded-lg bg-white p-6 shadow">

        <h2 className="mb-4 text-xl font-semibold">
          {editingId
            ? "Update Customer"
            : "Add Customer"}
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >

          <input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="rounded border p-3"
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="rounded border p-3"
          />

          <input
            type="text"
            name="phone"
            placeholder="Phone"
            value={formData.phone}
            onChange={handleChange}
            required
            className="rounded border p-3"
          />

          <input
            type="text"
            name="company"
            placeholder="Company"
            value={formData.company}
            onChange={handleChange}
            className="rounded border p-3"
          />

          <div className="flex gap-3 md:col-span-2">

            <button
              type="submit"
              className="rounded bg-blue-500 px-6 py-3 text-white hover:bg-blue-600"
            >
              {editingId
                ? "Update Customer"
                : "Add Customer"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                className="rounded bg-gray-500 px-6 py-3 text-white hover:bg-gray-600"
              >
                Cancel
              </button>
            )}

          </div>

        </form>
      </div>

      {/* Customer List */}
      <div className="rounded-lg bg-white p-6 shadow">

        <h2 className="mb-4 text-xl font-semibold">
          Customers
        </h2>

        {customers.length === 0 ? (
          <p className="text-gray-500">
            No customers found
          </p>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full border-collapse">

              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="border p-3">Name</th>
                  <th className="border p-3">Email</th>
                  <th className="border p-3">Phone</th>
                  <th className="border p-3">Company</th>
                  <th className="border p-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {customers.map((customer) => (
                  <tr key={customer._id}>

                    <td className="border p-3">
                      {customer.name}
                    </td>

                    <td className="border p-3">
                      {customer.email}
                    </td>

                    <td className="border p-3">
                      {customer.phone}
                    </td>

                    <td className="border p-3">
                      {customer.company}
                    </td>

                    <td className="border p-3">
                      <div className="flex gap-2">

                        <button
                          onClick={() =>
                            handleEdit(customer)
                          }
                          className="rounded bg-yellow-500 px-3 py-1 text-white"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(customer._id)
                          }
                          className="rounded bg-red-500 px-3 py-1 text-white"
                        >
                          Delete
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}

export default Dashboard;