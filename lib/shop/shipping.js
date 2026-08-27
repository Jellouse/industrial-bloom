const shippingCountries = [
  { code: "DE", de: "Deutschland", en: "Germany" },
  { code: "AT", de: "Österreich", en: "Austria" },
  { code: "BE", de: "Belgien", en: "Belgium" },
  { code: "CZ", de: "Tschechien", en: "Czechia" },
  { code: "DK", de: "Dänemark", en: "Denmark" },
  { code: "ES", de: "Spanien", en: "Spain" },
  { code: "FI", de: "Finnland", en: "Finland" },
  { code: "FR", de: "Frankreich", en: "France" },
  { code: "IE", de: "Irland", en: "Ireland" },
  { code: "IT", de: "Italien", en: "Italy" },
  { code: "LU", de: "Luxemburg", en: "Luxembourg" },
  { code: "NL", de: "Niederlande", en: "Netherlands" },
  { code: "PL", de: "Polen", en: "Poland" },
  { code: "PT", de: "Portugal", en: "Portugal" },
  { code: "SE", de: "Schweden", en: "Sweden" },
];

const shippingAmountCents = 1200;
const shippingMinBusinessDays = 3;
const shippingMaxBusinessDays = 7;

function shippingCountryCodes() {
  return shippingCountries.map((country) => country.code);
}

module.exports = {
  shippingAmountCents,
  shippingCountries,
  shippingCountryCodes,
  shippingMaxBusinessDays,
  shippingMinBusinessDays,
};
