# Kairos Interior Studio 🏛️

**Kairos Interior Studio** is a premium, AI-powered interior design platform designed to bridge the gap between user vision and professional execution. Built with Next.js, it provides an end-to-end experience from preference gathering to realistic 3D visualizations and designer matching.

---

## 🎓 Project Context & Digital Transformation

This application was developed as a comprehensive technical demonstration for a **Digital Business** course at University. It serves as a strategic proof-of-concept architectural study on how **Digital Transformation** can radically improve traditionally "low-tech" industries like Interior Design and Renovation.

In many legacy sectors, the process remains manual and opaque. Kairos explores how digitalization provides a significant **competitive advantage** through:
- **Value Creation**: Moving from passive consultations to an active, tech-driven design experience.
- **Information Asymmetry**: Bridging the gap between a designer’s vision and a client’s understanding via real-time AI visualization.
- **Strategic Agility**: Demonstrating how firms can pivot towards AI-integrated services to lead in the modern digital economy.

---

## 📽️ Project Background

The traditional interior design process is often fragmented, expensive, and overwhelming for homeowners. Kairos was conceptualized to democratize high-end interior design in Singapore. By leveraging AI to interpret user preferences and generate immediate spatial layouts, we empower users to visualize their dream homes instantly before committing to a designer.

---

## ✨ Core Features

### 1. Intelligent Design Wizard
A multi-step guided experience that captures:
- **Flat Type & Room Selection**: Specifically tailored for Singaporean housing layouts.
- **Style Profiling**: Choose from Minimalist, Industrial, Scandinavian, Japandi, and more.
- **Color Palettes**: Define the mood of your space.
- **Ranking Priorities**: Balance aesthetics, storage space, and budget.
- **Budget Management**: Real-time tracking against furniture selections.

### 2. Pro Room Configurator (2D Blueprint)
- **Interactive 2D Canvas**: Drag-and-drop furniture items on a precision-scaled blueprint.
- **Collision Detection**: Smart layout engine prevents furniture overlaps (with rug exceptions).
- **Smooth Drag UI**: Native 60fps interaction with graceful bounce-back animations for invalid placements.
- **Inventory Swap**: Instantly swap items with AI-suggested alternatives that fit your style and budget.

### 3. AI Photorealistic Rendering
- **3D Visualization**: Convert your 2D blueprints into high-fidelity AI-generated 3D renders consistent with your chosen style profile.

### 4. Designer Matching & Dashboard
- **Analytics**: Track your project costs and compare them against regional benchmarks.
- **Matching**: Get connected with professional interior designers who specialize in your specific generated style.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or later
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Javen420/interior-design.git
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open the application**:
   Navigate to [http://localhost:3000](http://localhost:3000) (or the port shown in your terminal).

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Graphics Engine**: React Konva (2D Canvas)
- **Animations**: Framer Motion
- **Data Visualization**: Recharts
- **Icons**: Lucide React
