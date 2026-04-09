function process(email) {
  try {
    var fromAddress = email.getFrom();
    nlapiLogExecution("DEBUG", "fromAddress:", fromAddress);

    var subject = email.getSubject();
    var textBody = email.getTextBody();
    nlapiLogExecution("DEBUG", "subject", subject);
    nlapiLogExecution("DEBUG", "text body", textBody);

    var firstName = extractValue(textBody, "First Name:");
    var lastName = extractValue(textBody, "Last Name:");
    var subsidiary = parseInt(extractValue(textBody, "Subsidiary:"));
    var emailadd = extractValue(textBody, "Email:");
    nlapiLogExecution("DEBUG", "firstName", firstName);
    nlapiLogExecution("DEBUG", "lastName", lastName);
    nlapiLogExecution("DEBUG", "subsidiary", subsidiary);
    nlapiLogExecution("DEBUG", "emailadd", emailadd);

    var existingLead = nlapiSearchRecord("lead", null, [
      ["email", "is", emailadd],
    ]);

    if (!existingLead || existingLead.length === 0) {
      var newLead = nlapiCreateRecord("lead");
      newLead.setFieldValue("isperson", "T");
      newLead.setFieldValue("firstname", firstName);
      newLead.setFieldValue("lastname", lastName);
      newLead.setFieldValue("subsidiary", subsidiary);
      newLead.setFieldValue("email", emailadd);

      var newLeadId = nlapiSubmitRecord(newLead);
      nlapiLogExecution("DEBUG", "New Lead Created:", newLeadId);
    } else {
      nlapiLogExecution("DEBUG", "Lead:", "Already exits lead");
      var existingLeadId = existingLead[0].getId();
      nlapiLogExecution("DEBUG", "Existing Lead Id:", existingLeadId);

      var loadLead = nlapiLoadRecord("lead", existingLeadId);
      var existingLeadStatus = loadLead.getFieldText("entitystatus");
      nlapiLogExecution("DEBUG", "Lead Status:", existingLeadStatus);

      if (existingLeadStatus == "LEAD-Unqualified") {
        var updatedLead = nlapiLoadRecord("lead", existingLeadId);
        var leadStatus = updatedLead.setFieldText(
          "entitystatus",
          "LEAD-Qualified"
        );
        nlapiSubmitRecord(updatedLead);
        nlapiLogExecution("DEBUG", "Lead Status Updated to:", "LEAD-Qualified");
      }
    }
  } catch (ex) {
    nlapiLogExecution("ERROR", "Process:", ex.message);
  }
}

function extractValue(textBody, key) {
  nlapiLogExecution("DEBUG", "key:", key);
  var startIndex = textBody.indexOf(key);
  nlapiLogExecution("DEBUG", "startIndex 1:", startIndex);
  if (startIndex === -1) return "";
  startIndex += key.length;
  nlapiLogExecution("DEBUG", "startIndex 2:", startIndex);
  var endIndex = textBody.indexOf("\n", startIndex);
  nlapiLogExecution("DEBUG", "endIndex 1:", endIndex);
  if (endIndex === -1) endIndex = textBody.length;
  nlapiLogExecution("DEBUG", "endIndex 2:", endIndex);
  return textBody.substring(startIndex, endIndex).trim();
}



// First Name: Test Lead
// Last Name: 007
// Subsidiary: Parent Company
// Email: text007@gmail.com