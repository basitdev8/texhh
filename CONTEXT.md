# TechChasers commerce

TechChasers sells consumer electronics and lets customers assemble compatible PC part selections. This glossary keeps storefront, ordering, and administration language consistent.

## Catalog

**Catalog**:
The set of active Products customers can browse, search, filter, and purchase.
_Avoid_: Edit, collection of pieces

**Product**:
A general sellable electronics item such as a phone, computer, watch, or accessory. A Product is distinct from a PC Component.
_Avoid_: Piece, object

**Category**:
A browsable grouping of Products, optionally nested under another Category.
_Avoid_: Collection

**PC Component**:
A sellable computer part assigned to one of the supported part types and carrying compatibility information.
_Avoid_: Product when the distinction affects compatibility or ordering

**PC Build**:
A customer’s selection of up to one PC Component for each supported part type, evaluated together for compatibility. It is a selection, not a separate bundled Product.
_Avoid_: Rig, bundle

**Compatibility**:
The result of evaluating whether selected PC Components can operate together, including blocking issues and non-blocking warnings.
_Avoid_: Fit when referring to the complete evaluation

**Signal Rail**:
A short, factual line of two or three useful Product specifications shown near a product name. It is derived from real data and omitted when reliable data is unavailable.
_Avoid_: Badge cloud, invented specification

## Shopping

**Customer**:
A person with a customer-role account who shops and places Orders.
_Avoid_: Client, buyer, account

**Cart**:
The customer’s persisted set of intended purchases before an Order is placed.
_Avoid_: Bag, basket

**Cart Line**:
A Product or PC Component in the Cart with a quantity, current price, image, and available-stock limit.
_Avoid_: Item when its source type matters

**Checkout**:
The delivery, payment, and review flow that validates a Cart and places an Order.
_Avoid_: Payment when referring to the complete flow

## Homepage merchandising

**Hero Spotlight**:
The single Product selected for the homepage campaign. It must not also appear in the Popular Products Rail.

**Popular Products Rail**:
The ordered set of Products selected for the homepage’s popular-products module. It is independently curated once its selection is configured.

## Orders and inventory

**Order**:
The recorded purchase created from validated Cart Lines for one Customer, delivery address, and payment method.
_Avoid_: Transaction, purchase record

**Fulfillment Status**:
The Order’s delivery lifecycle: pending, processing, shipped, delivered, or cancelled.
_Avoid_: Order status when payment or refund state is intended

**Payment Status**:
The payment lifecycle for an Order: pending, paid, failed, refunded, or abandoned.
_Avoid_: Order status

**Refund State**:
The progress of returning money for an Order, distinct from Payment Status and Fulfillment Status.
_Avoid_: Cancellation

**Stock Reservation**:
The claim on inventory associated with an Order, tracked independently from fulfillment and payment.
_Avoid_: Stock status

**Inventory Alert**:
An operational warning for an active Product with five or fewer units in stock. An out-of-stock Product is a more severe inventory condition, not merely a visual variant of a low-stock alert.

## Surfaces

**Storefront**:
The customer-facing shopping, building, checkout, account, order, and policy experience.
_Avoid_: Website when distinguishing it from Admin

**Admin**:
The protected operational experience used to manage catalog data, PC Components, Orders, Customers, homepage content, and store settings.
_Avoid_: Dashboard when referring to the whole surface
