# Catalogue provenance and customer-facing truth

The explicit ADMIN seed creates six **DEMO** entries, only if the entire product catalogue is empty: PERI, FURY, Mr-Sung HERO, RASSON OX II, Taom Pyro and Aramith. These are fixture labels, not a verified manufacturer inventory, exact specification, current offer or authorized reseller claim. The requested spelling “Furi” versus “FURY” still requires the owner's actual catalogue; do not silently present one as verified.

Price and quantity values are invented **only as visibly labeled test data**. Every seeded record is `is_demo=true` and its description explicitly states that price, stock and image are illustrative. Customer and inventory cards display the DEMO label. Seeding uses existing audited product/stock commands, requires ADMIN and a reason, refuses non-empty catalogues and does not overwrite owner data. It is not automatic startup data.

Images are the already-present repository illustrations under `apps/customer/public/showroom/assets/products/`. Shared artwork can stand in for multiple sample products; it is not a claimed photo of that model. No new third-party image, scraped specification, actual purchase price or actual stock count was acquired.

For real use, the owner must provide authorized images, exact SKU/model/variant, price, initial stock and venue. Existing sample products remain labeled DEMO; create real approved SKU records and hide samples instead of silently converting them. The current shop supports inventory receipts/issues and retail sales, not supplier invoices, marketplace resale, buyback, shipping automation or refund accounting.
