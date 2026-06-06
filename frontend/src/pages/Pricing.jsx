import { useEffect, useState } from "react";
import apiClient from "../services/apiClient";

const Pricing = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPricingPlans();
  }, []);

  const fetchPricingPlans = async () => {
    try {
      const res = await apiClient.get("/pricing/plans");
      setPlans(res.data.plans || []);
    } catch (error) {
      console.error("Failed to load pricing plans:", error);
      setPlans([
        {
          id: 1,
          name: "Free Plan",
          price: 0,
          currency: "BDT",
          duration: "monthly",
          description: "Basic access for students.",
          features: ["Limited resume analysis", "Basic interview practice"],
          button_text: "Start Free",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanClick = (plan) => {
    if (plan.whatsapp_link) {
      window.open(plan.whatsapp_link, "_blank");
    } else {
      alert(`${plan.name} selected`);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <h1>Loading pricing plans...</h1>
      </div>
    );
  }

  return (
    <div className="page pricing-page">
      <div className="pricing-header">
        <h1>Pricing Plans</h1>
        <p>Choose a plan that fits your interview preparation journey.</p>
      </div>

      <div className="pricing-grid">
        {plans.map((plan) => (
          <div className="pricing-card" key={plan.id}>
            <h2>{plan.name}</h2>

            <div className="pricing-price">
              <span className="pricing-currency">{plan.currency}</span>
              <span className="pricing-amount">{plan.price}</span>
              <span className="pricing-duration">/{plan.duration}</span>
            </div>

            <p className="pricing-description">{plan.description}</p>

            <ul className="pricing-features">
              {plan.features.map((feature, index) => (
                <li key={index}>✓ {feature}</li>
              ))}
            </ul>

            <button
              className="btn btn--primary btn--full"
              onClick={() => handlePlanClick(plan)}
            >
              {plan.button_text}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Pricing;