// Local swizzle of docusaurus-plugin-glossary's GlossaryTerm.
// Adds the acronym expansion (the `abbreviation` field, already in the
// glossary data) to the hover tooltip, so "VM" shows "Virtual Machine"
// before its definition. The upstream component renders term + definition
// only; everything else here mirrors the original behaviour.
import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { usePluginData } from "@docusaurus/useGlobalData";
import styles from "./styles.module.css";

function isMeaningfulAbbr(abbr, term) {
  if (!abbr || typeof abbr !== "string") return false;
  const a = abbr.trim();
  if (!a) return false;
  if (a.toLowerCase() === String(term).toLowerCase()) return false;
  // skip source placeholders like "(no expansion)" / "(no abbreviation)"
  if (/^\(no\b/i.test(a)) return false;
  return true;
}

export default function GlossaryTerm({ term, definition, abbreviation, routePath = "/glossary", children }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState(null);
  const [placement, setPlacement] = useState("top");
  const wrapperRef = useRef(null);
  const tooltipRef = useRef(null);

  const updatePosition = useCallback(() => {
    if (!wrapperRef.current || !tooltipRef.current) return;
    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const preferredGap = 8;
    const hasSpaceAbove = wrapperRect.top >= tooltipRect.height + preferredGap;
    const hasSpaceBelow = viewportHeight - wrapperRect.bottom >= tooltipRect.height + preferredGap;
    const nextPlacement = hasSpaceAbove || !hasSpaceBelow ? "top" : "bottom";
    const top = nextPlacement === "top"
      ? wrapperRect.top - tooltipRect.height - preferredGap
      : wrapperRect.bottom + preferredGap;
    const horizontalMargin = 8;
    let left = wrapperRect.left + wrapperRect.width / 2 - tooltipRect.width / 2;
    left = Math.max(horizontalMargin, Math.min(left, viewportWidth - tooltipRect.width - horizontalMargin));
    setPlacement(nextPlacement);
    setTooltipStyle({ top: Math.max(4, top), left });
  }, []);

  useEffect(() => {
    if (!showTooltip) return;
    let rafId2;
    const rafId1 = requestAnimationFrame(() => {
      rafId2 = requestAnimationFrame(() => updatePosition());
    });
    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(rafId1);
      if (rafId2) cancelAnimationFrame(rafId2);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [showTooltip, updatePosition]);

  const pluginData = usePluginData("docusaurus-plugin-glossary");
  const matched = useMemo(() => {
    const terms = (pluginData && pluginData.terms) || [];
    return terms.find(
      (t) => typeof t.term === "string" && t.term.toLowerCase() === String(term).toLowerCase()
    );
  }, [pluginData, term]);

  const effectiveDefinition = useMemo(() => {
    if (definition && typeof definition === "string" && definition.length > 0) return definition;
    return matched && matched.definition ? matched.definition : undefined;
  }, [definition, matched]);

  const effectiveAbbr = useMemo(() => {
    const abbr = abbreviation || (matched && matched.abbreviation);
    return isMeaningfulAbbr(abbr, term) ? abbr.trim() : undefined;
  }, [abbreviation, matched, term]);

  const effectiveRoutePath = useMemo(() => {
    if (routePath && typeof routePath === "string" && routePath.length > 0) return routePath;
    return (pluginData && pluginData.routePath) || "/glossary";
  }, [pluginData, routePath]);

  const displayText = children || term;
  const termId = term.toLowerCase().replace(/\s+/g, "-");

  return (
    <span ref={wrapperRef} className={styles.glossaryTermWrapper}>
      <a
        href={`${effectiveRoutePath}#${termId}`}
        className={styles.glossaryTerm}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        aria-describedby={`tooltip-${termId}`}
      >
        {displayText}
      </a>
      {effectiveDefinition && (
        <span
          ref={tooltipRef}
          id={`tooltip-${termId}`}
          className={`${styles.tooltip} ${showTooltip ? styles.tooltipVisible : ""} ${placement === "top" ? styles.tooltipTop : styles.tooltipBottom} ${styles.tooltipFloating}`}
          role="tooltip"
          style={showTooltip && tooltipStyle ? { top: `${tooltipStyle.top}px`, left: `${tooltipStyle.left}px` } : undefined}
        >
          <strong>{term}</strong>
          {effectiveAbbr && <span className={styles.tooltipAbbr}>{` — ${effectiveAbbr}`}</span>}
          {" "}
          {effectiveDefinition}
        </span>
      )}
    </span>
  );
}
