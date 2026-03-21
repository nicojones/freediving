/**
 * Tabs primitive for Phase 26 input modes.
 * Re-exports Headless UI Tab components with app's styling guidance.
 *
 * @example
 * ```tsx
 * import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '~/components/ui/Tabs';
 *
 * <TabGroup>
 *   <TabList className="flex gap-2 border-b border-outline-variant/30">
 *     <Tab className="px-4 py-2 rounded-t-lg data-selected:bg-surface-container-low data-selected:text-on-surface data-[selected=false]:text-on-surface-variant">
 *       Describe
 *     </Tab>
 *     <Tab className="px-4 py-2 rounded-t-lg data-selected:bg-surface-container-low data-selected:text-on-surface data-[selected=false]:text-on-surface-variant">
 *       Paste / Raw
 *     </Tab>
 *   </TabList>
 *   <TabPanels>
 *     <TabPanel>Describe mode content</TabPanel>
 *     <TabPanel>Paste/Raw mode content</TabPanel>
 *   </TabPanels>
 * </TabGroup>
 * ```
 *
 * Use `data-selected:` for presence-based styling (Tailwind v4).
 */
export { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
