"use client";

/**
 * PluginWrapper: semantic alias for PluginSlot used when wrapping default content.
 *
 * Convention:
 *   <PluginSlot name="x" />              — pure injection point, no default content
 *   <PluginWrapper name="x">…</PluginWrapper> — section plugins can override; children are the default
 */
export { PluginSlot as PluginWrapper } from "./PluginSlot";
