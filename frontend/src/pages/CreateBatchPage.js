import React, { useState } from "react";
import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useBlockchain } from "../components/BlockchainProvider";
import { useToast } from "../components/Toast";
import { createBatch } from "../utils/api";
import { productList } from "../utils/mockData";

const initialForm = {
  name: "Tomato",
  quantity: "",
  price: "",
  farmerName: "Wallet Farmer",
  location: "Farm Origin",
};

const examples = [
  { name: "Tomato", quantity: "100", price: "20" },
  { name: "Wheat", quantity: "150", price: "25" },
  { name: "Rice", quantity: "200", price: "60" },
  { name: "Onion", quantity: "80", price: "30" },
];

export default function CreateBatchPage() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const { createBatchTransaction, demoMode } = useBlockchain();
  const { error, success } = useToast();
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const fillExample = (example) => {
    setForm({
      name: example.name,
      quantity: example.quantity,
      price: example.price,
      farmerName: "Wallet Farmer",
      location: "Farm Origin",
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const tx = await createBatchTransaction({
        productName: form.name,
        farmerName: form.farmerName,
        location: form.location,
        quantity: Number(form.quantity),
        farmerPrice: Number(form.price),
        harvestDate: new Date().toISOString(),
      });

      await createBatch({
        name: form.name,
        quantity: Number(form.quantity),
        price: Number(form.price),
        status: "Farmer",
        farmerName: form.farmerName,
        originLocation: form.location,
        blockchainId: tx?.batchId || null,
        txHash: tx?.hash || "",
      });

      success(
        demoMode
          ? "Demo batch created and mirrored in the app."
          : "Live batch transaction signed in MetaMask and mirrored in the app."
      );
      setForm(initialForm);
      navigate("/batches");
    } catch (requestError) {
      error(requestError?.message || "Batch creation failed. Switch to demo mode if the contract is unavailable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <div className="eyebrow">Create Product</div>
          <h2>Add a product to the supply chain</h2>
          <p>
            This form now supports live MetaMask-signed batch creation while preserving the current
            app workflow as a mirrored record.
          </p>
        </div>
      </div>

      <div className="dashboard-layout">
        <div className="glass-card">
          <form className="form-grid" onSubmit={handleSubmit}>
            <label className="field">
              <span>Product Name</span>
              <select name="name" value={form.name} onChange={handleChange} required>
                {productList.map((product) => (
                  <option key={product} value={product}>
                    {product}
                  </option>
                ))}
              </select>
            </label>

            <div className="field-row">
              <label className="field">
                <span>Farmer Name</span>
                <input
                  name="farmerName"
                  type="text"
                  value={form.farmerName}
                  onChange={handleChange}
                  placeholder="Wallet Farmer"
                  required
                />
              </label>

              <label className="field">
                <span>Origin Location</span>
                <input
                  name="location"
                  type="text"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Farm Origin"
                  required
                />
              </label>
            </div>

            <div className="field-row">
              <label className="field">
                <span>Quantity (kg)</span>
                <input
                  name="quantity"
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={handleChange}
                  placeholder="100"
                  required
                />
              </label>

              <label className="field">
                <span>Farmer Price (Rs./kg)</span>
                <input
                  name="price"
                  type="number"
                  min="1"
                  step="1"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="20"
                  required
                />
              </label>
            </div>

            <button type="submit" className="button button-primary" disabled={loading}>
              {loading ? "Creating..." : demoMode ? "Create In Demo Mode" : "Create With MetaMask"}
            </button>
          </form>
        </div>

        <div className="side-stack">
          <div className="glass-card compact-card">
            <div className="feature-chip">
              <Sparkles size={16} />
              <span>Quick examples</span>
            </div>
            <div className="example-pills">
              {examples.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  className="pill-button"
                  onClick={() => fillExample(item)}
                >
                  {item.name} - Rs. {item.price}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card compact-card">
            <h3>How it works</h3>
            <p>After signing, the batch is mirrored into the current app workflow so all dashboards stay intact.</p>
            <div className="how-it-works-steps">
              <span>Farmer - Processing - Distributor - Retail - Consumer</span>
            </div>
            <p>{demoMode ? "Demo mode is active. Use the navbar toggle to switch back to live signing." : "Live mode is active. MetaMask will prompt for a transaction signature."}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
