TechChasers — Full-Stack Electronics E-Commerce Platform
A premium electronics e-commerce platform built with Next.js 15 (App Router) and MongoDB (Mongoose), featuring a customer storefront, admin panel, and custom PC builder.

Brand & Design Direction
Brand Name: TechChasers (derived from workspace name)
Brand Identity: Premium electronics retailer — clean, minimal, luxurious
Color Palette (Light, neutral, with a warm accent):

Role	Color	Usage
Background	#FAFAF8 (Warm Off-White)	Page backgrounds
Surface	#FFFFFF	Cards, modals, inputs
Text Primary	#1A1A1A	Headings, body text
Text Secondary	#6B6B6B	Captions, muted text
Border	#E8E5E0	Dividers, card borders
Accent	#C87941 (Warm Copper)	CTAs, highlights, brand mark
Accent Hover	#A8612F	Button hover states
Success	#3D8B5F	Order confirmed, in-stock
Error	#C75450	Validation, out-of-stock
Typography: "Outfit" (headings) + "Inter" (body) — both from Google Fonts
Design Style: Generous whitespace, subtle shadows, smooth micro-animations, editorial photography layouts. No dark mode.

User Review Required
IMPORTANT

Brand Name: I've used "TechChasers" as the brand name based on the workspace folder name. Would you like a different name?

IMPORTANT

Color Accent: I've chosen a warm copper/bronze (#C87941) as the brand accent — it conveys luxury and premium tech. Let me know if you'd prefer a different accent color.

IMPORTANT

Authentication: I'll implement a custom JWT-based auth system (bcryptjs + jsonwebtoken + HTTP-only cookies) for simplicity. NextAuth can be swapped in later if needed. Is this acceptable?

IMPORTANT

Image Storage: For the initial build, product images will be stored locally in public/uploads/. For production, you'd migrate to Cloudinary or AWS S3. Is this fine for now?

Open Questions
NOTE

Payment Integration: No payment gateway will be integrated in this initial build. The checkout flow will capture order details and mark orders as "pending". You can plug in Stripe/Razorpay later. Does this work for you?

NOTE

User Registration: Should customers be able to create accounts and track orders, or is guest checkout sufficient for the MVP?

Tech Stack
Layer	Technology
Framework	Next.js 15 (App Router, TypeScript)
Database	MongoDB + Mongoose
Auth	Custom JWT (bcryptjs + jsonwebtoken)
State Management	Zustand (cart persistence) + React Context (auth)
Styling	Vanilla CSS (CSS Modules + CSS Custom Properties)
Validation	Zod (API request validation)
Image Optimization	next/image component
Font	Google Fonts (Outfit + Inter)
Proposed Changes
1. Project Initialization & Configuration
[NEW] Next.js project setup
Initialize with npx -y create-next-app@latest ./ --ts --eslint --src-dir --app --import-alias "@/*" --use-npm --yes
No Tailwind — we'll use vanilla CSS with CSS Modules
[NEW] 
.env.local

MONGODB_URI=mongodb://localhost:27017/techchasers
JWT_SECRET=your-secret-key-here
NEXT_PUBLIC_APP_NAME=TechChasers
[NEW] 
next.config.ts
Configure image remote patterns
Set up redirects/rewrites if needed
2. Database Layer (src/lib/ + src/models/)
[NEW] 
src/lib/db.ts
Mongoose connection with global caching pattern (prevents connection leaks in dev/serverless)
[NEW] 
src/lib/auth.ts
JWT token creation, verification, and cookie management
Password hashing helpers (bcryptjs)
getSession() utility for API routes
[NEW] 
src/lib/utils.ts
Price formatting, slug generation, date formatting helpers
[NEW] Mongoose Models:
Model File	Key Fields
src/models/User.ts
name, email, passwordHash, role (admin/customer), addresses, createdAt
src/models/Product.ts
name, slug, description, price, comparePrice, category, brand, images[], specifications{}, stock, featured, rating
src/models/Category.ts
name, slug, description, image, parentCategory
src/models/Order.ts
user, items[], shippingAddress, totalAmount, status (pending/processing/shipped/delivered/cancelled), paymentStatus, createdAt
src/models/PCComponent.ts
name, type (CPU/GPU/RAM/Storage/Motherboard/PSU/Case/Cooler), brand, price, image, specifications{}, compatibility[], stock
3. API Routes (src/app/api/)
All API routes follow RESTful conventions with proper error handling and Zod validation.

Auth APIs
Route	Methods	Purpose
api/auth/register/route.ts
POST	Customer registration
api/auth/login/route.ts
POST	Login (returns JWT cookie)
api/auth/logout/route.ts
POST	Clear JWT cookie
api/auth/me/route.ts
GET	Get current user from token
Product APIs
Route	Methods	Purpose
api/products/route.ts
GET, POST	List (with filtering, search, pagination) / Create
api/products/[id]/route.ts
GET, PUT, DELETE	Single product CRUD
Category APIs
Route	Methods	Purpose
api/categories/route.ts
GET, POST	List / Create
api/categories/[id]/route.ts
GET, PUT, DELETE	Single category CRUD
Order APIs
Route	Methods	Purpose
api/orders/route.ts
GET, POST	List user's orders / Place order
api/orders/[id]/route.ts
GET, PUT	Order detail / Update status (admin)
PC Builder APIs
Route	Methods	Purpose
api/pc-components/route.ts
GET, POST	List components by type / Add component (admin)
api/pc-components/[id]/route.ts
PUT, DELETE	Update / Delete component
Upload API
Route	Methods	Purpose
api/upload/route.ts
POST	Handle image uploads to public/uploads/
Admin Stats API
Route	Methods	Purpose
api/admin/stats/route.ts
GET	Dashboard statistics (revenue, orders, products count)
4. Customer Storefront (src/app/(storefront)/)
Uses a route group (storefront) for shared layout (header + footer) without affecting URLs.

[NEW] 
src/app/(storefront)/layout.tsx
Storefront shell: Header (logo, navigation, search, cart icon, account) + Footer
Pages:
Page	File	Key Features
Homepage	
page.tsx
Hero banner with animated text, featured categories grid, trending products carousel, "Build Your PC" CTA section, brand trust strip
Products Listing	
products/page.tsx
Filterable grid (category, price range, brand), sort options, pagination, animated product cards
Product Detail	
products/[slug]/page.tsx
Image gallery, specifications table, add-to-cart with quantity, related products
Category Page	
categories/[slug]/page.tsx
Category-specific product listing with hero
PC Builder	
pc-builder/page.tsx
Step-by-step component selection (CPU → GPU → RAM → Storage → Motherboard → PSU → Case → Cooler), live pricing summary, compatibility checks, "Add Build to Cart"
Cart	
cart/page.tsx
Item list with quantity controls, price summary, proceed to checkout
Checkout	
checkout/page.tsx
Shipping form, order summary, place order button
Login/Register	
auth/login/page.tsx
Clean auth form with toggle between login/register
Account	
account/page.tsx
Profile info, order history list
Order Detail	
account/orders/[id]/page.tsx
Order timeline, items, tracking status
Search	
search/page.tsx
Search results with query parameter
5. Admin Panel (src/app/admin/)
Protected by middleware — only accessible to users with role: "admin".

[NEW] 
src/app/admin/layout.tsx
Admin shell: Fixed sidebar navigation + top bar with admin info
Pages:
Page	File	Key Features
Dashboard	
admin/page.tsx
Revenue card, orders count, products count, recent orders table, quick charts
Products	
admin/products/page.tsx
Data table with search, filter, bulk actions, add/edit/delete
Add/Edit Product	
admin/products/new/page.tsx
Rich form: name, description, pricing, images upload, category, specs, stock
Orders	
admin/orders/page.tsx
Orders table with status filters, update status actions
Order Detail	
admin/orders/[id]/page.tsx
Full order info, status updater, customer info
Categories	
admin/categories/page.tsx
Category CRUD with image upload
PC Components	
admin/pc-components/page.tsx
Manage PC builder components by type
Customers	
admin/customers/page.tsx
Customer list with order count
6. Shared Components (src/components/)
UI Primitives (src/components/ui/)
Component	Purpose
Button.tsx	Primary, secondary, ghost, icon variants with hover animations
Input.tsx	Styled input with label, error state, floating label animation
Modal.tsx	Overlay modal with smooth enter/exit animation
Badge.tsx	Status badges (in-stock, out-of-stock, order status)
Spinner.tsx	Loading spinner
Toast.tsx	Toast notification system
Select.tsx	Styled dropdown select
Pagination.tsx	Page navigation component
Storefront Components (src/components/storefront/)
Component	Purpose
Header.tsx	Navigation bar with logo, links, search, cart badge, account
Footer.tsx	Site footer with links, newsletter, social
ProductCard.tsx	Animated product card with image, name, price, hover effect
HeroBanner.tsx	Homepage hero with animated headline
CategoryCard.tsx	Category display card
SearchBar.tsx	Expandable search input
ProductGallery.tsx	Product detail image gallery with thumbnails
CartItem.tsx	Cart item row with quantity controls
Admin Components (src/components/admin/)
Component	Purpose
Sidebar.tsx	Fixed navigation sidebar
DataTable.tsx	Reusable sortable data table
StatsCard.tsx	Dashboard metric card
ImageUploader.tsx	Drag-and-drop image upload
ProductForm.tsx	Product create/edit form
PC Builder Components (src/components/pc-builder/)
Component	Purpose
ComponentSelector.tsx	Component type selection with cards
BuildSummary.tsx	Live pricing summary sidebar
ComponentCard.tsx	Individual PC component card
CompatibilityBadge.tsx	Shows compatibility status
StepIndicator.tsx	Build progress steps
7. State Management & Hooks
[NEW] 
src/store/cartStore.ts
Zustand store with persist middleware (localStorage)
Actions: addItem, removeItem, updateQuantity, clearCart, getTotal
[NEW] 
src/context/AuthContext.tsx
Auth provider wrapping the app
Exposes: user, login, logout, isAuthenticated, isAdmin
Custom Hooks:
Hook	Purpose
src/hooks/useCart.ts
Convenience wrapper around Zustand cart store
src/hooks/useAuth.ts
Auth context consumer hook
8. Middleware & Protection
[NEW] 
src/middleware.ts
Intercept requests to /admin/* routes
Verify JWT token from cookies
Redirect unauthenticated/non-admin users to login
Protect admin API routes (/api/admin/*, POST/PUT/DELETE on resources)
9. Database Seeding
[NEW] 
src/lib/seed.ts
Script to seed the database with:
Default admin user (
admin@techchasers.com
 / admin123)
Sample categories (Laptops, Smartphones, Accessories, Audio, Monitors, PC Components)
Sample products (3-5 per category with realistic data)
Sample PC components (CPUs, GPUs, RAM, etc.)
Run via npx ts-node src/lib/seed.ts or a custom npm script
Design Highlights
Homepage Hero
Full-width hero with editorial-style product photography
Animated gradient text for tagline
Smooth scroll-triggered animations using CSS @keyframes and IntersectionObserver
Product Cards
Subtle box-shadow elevation on hover
Image zoom effect on hover
Price with compare-at strikethrough
"Add to Cart" slides up on hover
PC Builder
Step-by-step wizard UI with animated transitions
Live pricing counter with number animation
Visual component slots that "fill in" as you select
Compatibility warnings with gentle pulse animation
Admin Panel
Clean, data-dense layout
Collapsible sidebar
Smooth table row animations
Status badges with color coding
Verification Plan
Automated Tests
bash

npm run build          # Ensure TypeScript compiles and pages build
npm run lint           # ESLint passes
Manual Verification
Navigate all storefront pages and verify rendering
Test product listing with filters/search/pagination
Complete full cart → checkout flow
Test PC builder with component selection and pricing
Login as admin and test CRUD operations for products, categories, orders
Verify responsive layouts on mobile/tablet/desktop
Test image upload functionality
Verify cart persistence across page refreshes (Zustand + localStorage)
Verify admin route protection (redirect non-admin users)
Execution Order
Initialize project — scaffolding, dependencies, config
Database layer — connection, models, seed data
API routes — all CRUD endpoints
Auth system — JWT, middleware, login/register
Design system — CSS variables, base components (Button, Input, etc.)
Storefront layout — Header, Footer, shared layout
Homepage — Hero, featured sections
Product pages — listing, detail, category
Cart & Checkout — Zustand store, cart page, checkout flow
PC Builder — component selector, pricing, build summary
Admin panel — layout, dashboard, product/order/category management
Polish — animations, responsive design, edge cases
Seed & Verify — seed database, test all flows