import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Screen, Row, SectionLabel } from "../../components/screen/Screen";
import { useApp } from "../../state/store";

export default function AddFunds() {
  const navigate = useNavigate();
  const { state } = useApp();

  return (
    <Screen title="Add Funds" onBack={() => navigate(-1)}>
      <SectionLabel>Select Method</SectionLabel>
      <Row 
        icon="wallet" 
        label="Bank Transfer" 
        hint="Free • 1-3 days"
        onClick={() => navigate("/payment-methods")}
      />
      <Row 
        icon="card" 
        label="Debit / Credit Card" 
        hint="Instant • 2% fee"
        onClick={() => navigate("/payment-methods")}
      />
      <Row 
        icon="arrow-down" 
        label="Crypto Deposit" 
        hint="Receive from another wallet"
        onClick={() => navigate("/receive")}
      />
    </Screen>
  );
}
