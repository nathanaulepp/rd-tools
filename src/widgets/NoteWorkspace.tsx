import React, { useState } from "react";
import { handleExitToStart } from "../shared/ui/exitToStart";

export default function NoteWorkspace() {
    const [currentView, setCurrentView] = useState<ViewState>("START");

    // --- EXISTING WORKSPACE STATE ---
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeDomain, setActiveDomain] = useState<"A" | "B" | "C" | "D" | "fluid">("A");
    const [activeSubDomain, setActiveSubDomain] = useState<string>("D1");
    const [searchQuery, setSearchQuery] = useState("");
    const [toastMsg, setToastMsg] = useState("");

    const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
    };

    const handleDomainSwitch = (domain: "A" | "B" | "C" | "D" | "fluid") => {
    if (domain !== activeDomain) {
        showToast(`Auto-saved previous section`);
        setActiveDomain(domain);
        if (window.innerWidth <= 768) setSidebarOpen(false);
        }
    return (
    
  );