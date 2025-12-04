"use client";

import React from "react"
import { useEffect, useState } from "react";
import { cn } from "./ui/cn";
import { motion, AnimatePresence } from "framer-motion";

type FilterMenuProps = {
	onTagChange: (tags: string[]) => void;
	onAllergenChange: (allergens: string[]) => void;
};

export default function FilterMenu({ onTagChange, onAllergenChange }: FilterMenuProps) {
	const [tags, setTags] = useState<string[]>([]);
	const [allergens, setAllergens] = useState<string[]>([]);
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
	const [tagsOpen, setTagsOpen] = useState(false);
	const [allergensOpen, setAllergensOpen] = useState(false);

	useEffect(() => {
		fetch("/api/filters")
			.then(res => res.json())
			.then(data => {
				setTags(data.tags ?? []);
				setAllergens(data.allergens ?? []);
			})
			.catch(err => console.error("Failed to fetch filters:", err));
	}, []);

	const toggleTag = (tag: string) => {
		const updated = selectedTags.includes(tag)
			? selectedTags.filter(t => t !== tag)
			: [...selectedTags, tag];
		setSelectedTags(updated);
		onTagChange(updated);
	};

	const toggleAllergen = (allergen: string) => {
		const updated = selectedAllergens.includes(allergen)
			? selectedAllergens.filter(a => a !== allergen)
			: [...selectedAllergens, allergen];
		setSelectedAllergens(updated);
		onAllergenChange(updated);
	};

	return (
		<section className="rounded-2xl border border-neutral-200 bg-white/90 backdrop-blur-md p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:border-[#303237] dark:bg-[#1c1e23]/90 dark:shadow-[0_4px_12px_rgba(0,0,0,0.25)]">
			<h2 className="mb-4 text-xl font-bold text-neutral-900 dark:text-neutral-100">Filters</h2>

			{/* Tags Dropdown */}
			<details 
				className="mb-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 transition-all hover:bg-neutral-100 dark:border-[#303237] dark:bg-[#26282d] dark:hover:bg-[#2e3035]"
				open={tagsOpen}
				onToggle={(e) => setTagsOpen((e.target as HTMLDetailsElement).open)}
			>
				<summary className="cursor-pointer text-base font-semibold text-neutral-900 dark:text-neutral-100 list-none">
					<div className="flex items-center justify-between">
						<span>🏷️ Tags</span>
						<motion.span
							animate={{ rotate: tagsOpen ? 180 : 0 }}
							transition={{ duration: 0.2 }}
							className="text-neutral-500"
						>
							▼
						</motion.span>
					</div>
				</summary>
				<AnimatePresence>
					{tagsOpen && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							transition={{ duration: 0.2 }}
							className="mt-3 flex flex-wrap gap-2 overflow-hidden"
						>
							{tags.map(tag => (
								<motion.button
									key={tag}
									onClick={() => toggleTag(tag)}
									className={cn(
										"rounded-full border-2 px-4 py-2 text-sm font-medium transition-all",
										selectedTags.includes(tag)
											? "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-500 shadow-md"
											: "bg-[#f0ece6] text-gray-800 border-neutral-200 hover:bg-[#e9e4dd] dark:bg-[#26282d] dark:text-neutral-200 dark:border-[#303237] dark:hover:bg-[#303237]"
									)}
									aria-pressed={selectedTags.includes(tag)}
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
								>
									{tag}
								</motion.button>
							))}
						</motion.div>
					)}
				</AnimatePresence>
			</details>

			{/* Allergens Dropdown */}
			<details 
				className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 transition-all hover:bg-neutral-100 dark:border-[#303237] dark:bg-[#26282d] dark:hover:bg-[#2e3035]"
				open={allergensOpen}
				onToggle={(e) => setAllergensOpen((e.target as HTMLDetailsElement).open)}
			>
				<summary className="cursor-pointer text-base font-semibold text-neutral-900 dark:text-neutral-100 list-none">
					<div className="flex items-center justify-between">
						<span>⚠️ Allergens</span>
						<motion.span
							animate={{ rotate: allergensOpen ? 180 : 0 }}
							transition={{ duration: 0.2 }}
							className="text-neutral-500"
						>
							▼
						</motion.span>
					</div>
				</summary>
				<AnimatePresence>
					{allergensOpen && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							transition={{ duration: 0.2 }}
							className="mt-3 flex flex-wrap gap-2 overflow-hidden"
						>
							{allergens.map(a => (
								<motion.button
									key={a}
									onClick={() => toggleAllergen(a)}
									className={cn(
										"rounded-full border-2 px-4 py-2 text-sm font-medium transition-all",
										selectedAllergens.includes(a)
											? "bg-gradient-to-r from-red-500 to-red-600 text-white border-red-500 shadow-md"
											: "bg-[#f0ece6] text-gray-800 border-neutral-200 hover:bg-[#e9e4dd] dark:bg-[#26282d] dark:text-neutral-200 dark:border-[#303237] dark:hover:bg-[#303237]"
									)}
									aria-pressed={selectedAllergens.includes(a)}
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
								>
									{a}
								</motion.button>
							))}
						</motion.div>
					)}
				</AnimatePresence>
			</details>
		</section>
	);
}
