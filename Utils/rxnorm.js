const axios = require("axios");

// RxNorm REST API — completely free, no API key required
// Docs: https://lhncbc.nlm.nih.gov/RxNav/APIs/RxNormAPIs.html
const RXNORM_BASE = "https://rxnav.nlm.nih.gov/REST";

// ── Helper: safe axios GET with timeout ────────────────────────
const rxGet = async (url, params = {}) => {
  const response = await axios.get(url, {
    params,
    timeout: 8000,
    headers: { Accept: "application/json" },
  });
  return response.data;
};

// ─────────────────────────────────────────────────────────────
// SEARCH: Find medicines by name
// Returns array of { rxcui, name, synonym }
// ─────────────────────────────────────────────────────────────
const searchMedicineByName = async (name) => {
  const data = await rxGet(`${RXNORM_BASE}/drugs.json`, { name });

  const conceptGroup = data?.drugGroup?.conceptGroup || [];
  const results = [];

  for (const group of conceptGroup) {
    if (group.conceptProperties) {
      for (const concept of group.conceptProperties) {
        results.push({
          rxcui:    concept.rxcui,
          name:     concept.name,
          tty:      concept.tty,   // Term type: IN=ingredient, BN=brand, SBD=branded drug
          synonym:  concept.synonym || "",
        });
      }
    }
  }

  return results;
};

// ─────────────────────────────────────────────────────────────
// LOOKUP: Get full medicine details by RXCUI
// Returns name, dosage forms, ingredients, brands
// ─────────────────────────────────────────────────────────────
const getMedicineByRxcui = async (rxcui) => {
  const data = await rxGet(`${RXNORM_BASE}/rxcui/${rxcui}/allProperties.json`, {
    prop: "all",
  });

  const props = data?.propConceptGroup?.propConcept || [];
  const details = {};

  for (const prop of props) {
    details[prop.propName] = prop.propValue;
  }

  return {
    rxcui,
    name:        details["RxNorm Name"] || details["RXNORM"] || "",
    dosageForm:  details["DOSE_FORM"]   || "",
    strength:    details["STRENGTH"]    || "",
    fullName:    details["RxNorm Name"] || "",
  };
};

// ─────────────────────────────────────────────────────────────
// BRANDS: Get all brand names for a generic medicine (by RXCUI)
// Useful for the brand suggestion feature
// ─────────────────────────────────────────────────────────────
const getBrandsForRxcui = async (rxcui) => {
  const data = await rxGet(`${RXNORM_BASE}/rxcui/${rxcui}/related.json`, {
    tty: "BN+SBD+SBDG",
  });

  const conceptGroup = data?.relatedGroup?.conceptGroup || [];
  const brands = [];

  for (const group of conceptGroup) {
    if (group.conceptProperties) {
      for (const concept of group.conceptProperties) {
        brands.push({
          rxcui: concept.rxcui,
          name:  concept.name,
          tty:   concept.tty,
        });
      }
    }
  }

  // Deduplicate by name
  const seen = new Set();
  return brands.filter((b) => {
    if (seen.has(b.name)) return false;
    seen.add(b.name);
    return true;
  });
};

// ─────────────────────────────────────────────────────────────
// SPELLING CHECK: Suggest correct spelling for a medicine name
// ─────────────────────────────────────────────────────────────
const spellCheckMedicine = async (name) => {
  const data = await rxGet(`${RXNORM_BASE}/spellingsuggestions.json`, { name });
  return data?.suggestionGroup?.suggestionList?.suggestion || [];
};

// ─────────────────────────────────────────────────────────────
// RESOLVE RXCUI: Get the base RXCUI for an ingredient name
// e.g. "Paracetamol" or "Acetaminophen" → "161"
// ─────────────────────────────────────────────────────────────
const resolveRxcui = async (name) => {
  const data = await rxGet(`${RXNORM_BASE}/rxcui.json`, {
    name,
    search: 1,
  });

  const rxcui = data?.idGroup?.rxnormId?.[0] || null;
  return rxcui;
};

// ─────────────────────────────────────────────────────────────
// VALIDATE: Check if a given RXCUI is valid and active
// Enhanced to handle packs (BPCK/GPCK) and 404 responses
// ─────────────────────────────────────────────────────────────
const validateRxcui = async (rxcui) => {
  try {
    // First check status
    const statusData = await rxGet(`${RXNORM_BASE}/rxcui/${rxcui}/status.json`);
    const status = statusData?.rxcuiStatus?.status;
    
    return {
      isValid: status === "Active" || status === "Quantified",
      status: status || "Unknown",
      isPack: false
    };
  } catch (error) {
    // If we get a 404, try to get properties as fallback
    if (error.response && error.response.status === 404) {
      try {
        // Try to get properties - if this succeeds, the RXCUI exists
        const propData = await rxGet(`${RXNORM_BASE}/rxcui/${rxcui}/allProperties.json`, {
          prop: "all",
        });
        
        const props = propData?.propConceptGroup?.propConcept || [];
        
        // If we have properties, the RXCUI exists
        if (props.length > 0) {
          // Check if it's a pack (look for term type)
          const ttyProp = props.find(p => p.propName === "TTY");
          const tty = ttyProp?.propValue || "";
          
          // Check if it's a pack type
          const isPack = ["BPCK", "GPCK"].includes(tty);
          
          // Also get the name for reference
          const nameProp = props.find(p => p.propName === "RxNorm Name");
          const name = nameProp?.propValue || "";
          
          console.log(`RXCUI ${rxcui} found with TTY: ${tty}, isPack: ${isPack}, name: ${name}`);
          
          return {
            isValid: true,  // It exists in RxNorm
            status: isPack ? "Pack" : "Exists",
            tty: tty,
            isPack: isPack,
            name: name
          };
        }
      } catch (propError) {
        console.error(`Properties fetch failed for ${rxcui}:`, propError.message);
        // Properties also failed, RXCUI really doesn't exist
        return { 
          isValid: false, 
          status: "NotFound",
          isPack: false 
        };
      }
    }
    
    // For other errors
    console.error("validateRxcui error:", error.message);
    return { isValid: false, status: "NotFound", isPack: false };
  }
};

module.exports = {
  searchMedicineByName,
  getMedicineByRxcui,
  getBrandsForRxcui,
  spellCheckMedicine,
  resolveRxcui,
  validateRxcui,
};