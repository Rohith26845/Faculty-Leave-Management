function classifyLeaveReason(reason) {
  if (!reason || typeof reason !== "string") {
    return "Unknown";
  }

  const text = reason.toLowerCase();

  // Sick Leave
  if (
    text.includes("fever") ||
    text.includes("cold") ||
    text.includes("cough") ||
    text.includes("headache") ||
    text.includes("hospital") ||
    text.includes("doctor") ||
    text.includes("medical") ||
    text.includes("sick")
  ) {
    return "Sick Leave";
  }

  // Emergency Leave
  if (
    text.includes("emergency") ||
    text.includes("accident") ||
    text.includes("urgent") ||
    text.includes("operation") ||
    text.includes("critical") ||
    text.includes("death")
  ) {
    return "Emergency Leave";
  }

  // Casual Leave
  if (
    text.includes("family function") ||
    text.includes("wedding") ||
    text.includes("marriage") ||
    text.includes("festival") ||
    text.includes("travel") ||
    text.includes("vacation") ||
    text.includes("personal work")
  ) {
    return "Casual Leave";
  }

  // Official Leave
  if (
    text.includes("conference") ||
    text.includes("seminar") ||
    text.includes("workshop") ||
    text.includes("training") ||
    text.includes("meeting") ||
    text.includes("official work")
  ) {
    return "Official Leave";
  }

  return "General Leave";
}

// TEST OUTPUT
console.log("Test 1:", classifyLeaveReason("I have fever and cold"));
console.log("Test 2:", classifyLeaveReason("I need to attend a family wedding"));
console.log("Test 3:", classifyLeaveReason("I have an urgent emergency"));
console.log("Test 4:", classifyLeaveReason("I need to attend a workshop"));

module.exports = classifyLeaveReason;