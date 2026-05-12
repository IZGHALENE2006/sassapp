import { useEffect } from "react";

export default function useFocusSearchShortcut(inputId) {
  useEffect(() => {
    const handleFocusRequest = () => {
      const targetInput = document.getElementById(inputId);
      if (!targetInput) return;
      targetInput.focus();
      if (typeof targetInput.select === "function") {
        targetInput.select();
      }
    };

    window.addEventListener("app:focus-search", handleFocusRequest);
    return () => window.removeEventListener("app:focus-search", handleFocusRequest);
  }, [inputId]);
}
