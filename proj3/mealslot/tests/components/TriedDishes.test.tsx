/** @vitest-environment happy-dom */

import React, { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const MockTriedButton = ({ dishId, dishName }: { dishId: string; dishName?: string }) => {
    const [isTried, setIsTried] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
        setLoading(true);
        try {
            if (!isTried) {
                setIsTried(true);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            data-testid={`tried-btn-${dishId}`}
            aria-pressed={isTried}
        >
            {isTried ? "Tried ✅" : "Tried it"}
        </button>
    );
};

const MockTriedCard = ({
    item,
    onDelete,
    onUpdate,
}: {
    item: any;
    onDelete?: () => void;
    onUpdate?: (notes?: string, rating?: number) => void;
}) => {
    const [editing, setEditing] = useState(false);
    const [notes, setNotes] = useState(item.notes ?? "");

    const handleSave = () => {
        onUpdate?.(notes, item.rating);
        setEditing(false);
    };

    return (
        <div data-testid={`tried-card-${item.id}`}>
            <div>{item.dishName}</div>
            <div>{item.rating ? `★ ${item.rating}` : null}</div>

            {!editing ? (
                <div data-testid={`notes-display-${item.id}`}>
                    {item.notes ?? "No notes"}
                </div>
            ) : (
                <textarea
                    data-testid={`notes-input-${item.id}`}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />
            )}

            {editing ? (
                <>
                    <button data-testid={`save-btn-${item.id}`} onClick={handleSave}>
                        Save
                    </button>
                    <button data-testid={`cancel-btn-${item.id}`} onClick={() => setEditing(false)}>
                        Cancel
                    </button>
                </>
            ) : (
                <>
                    <button data-testid={`edit-btn-${item.id}`} onClick={() => setEditing(true)}>
                        Edit
                    </button>
                    <button data-testid={`remove-btn-${item.id}`} onClick={() => onDelete?.()}>
                        Remove
                    </button>
                </>
            )}
        </div>
    );
};

describe("TriedButton Component", () => {
    it("displays 'Tried it' button initially", () => {
        render(<MockTriedButton dishId="pizza-1" dishName="Pizza" />);
        expect(screen.getByText("Tried it")).toBeInTheDocument();
    });

    it("changes to 'Tried ✅' when clicked", async () => {
        render(<MockTriedButton dishId="pizza-1" />);
        const button = screen.getByTestId("tried-btn-pizza-1");

        await userEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText("Tried ✅")).toBeInTheDocument();
        });
    });

    it("sets aria-pressed correctly", async () => {
        render(<MockTriedButton dishId="pizza-1" />);
        const button = screen.getByTestId("tried-btn-pizza-1");

        expect(button).toHaveAttribute("aria-pressed", "false");

        await userEvent.click(button);

        await waitFor(() => {
            expect(button).toHaveAttribute("aria-pressed", "true");
        });
    });

    it("works independently for different dish IDs", async () => {
        render(
            <>
                <MockTriedButton dishId="pizza-1" />
                <MockTriedButton dishId="burger-1" />
            </>
        );

        const pizzaBtn = screen.getByTestId("tried-btn-pizza-1");
        await userEvent.click(pizzaBtn);

        expect(pizzaBtn).toHaveAttribute("aria-pressed", "true");
        expect(screen.getByTestId("tried-btn-burger-1")).toHaveAttribute("aria-pressed", "false");
    });
});

describe("TriedCard Component", () => {
    const mockItem = {
        id: "tried-1",
        dishId: "pizza-1",
        dishName: "Pizza",
        dateTried: new Date().toISOString(),
        notes: "Delicious",
        rating: 4.5,
    };

    it("displays dish name and rating", () => {
        render(<MockTriedCard item={mockItem} />);
        expect(screen.getByText("Pizza")).toBeInTheDocument();
        expect(screen.getByText("★ 4.5")).toBeInTheDocument();
    });

    it("displays notes when present", () => {
        render(<MockTriedCard item={mockItem} />);
        expect(screen.getByText("Delicious")).toBeInTheDocument();
    });

    it("shows edit and remove buttons", () => {
        render(<MockTriedCard item={mockItem} />);
        expect(screen.getByTestId("edit-btn-tried-1")).toBeInTheDocument();
        expect(screen.getByTestId("remove-btn-tried-1")).toBeInTheDocument();
    });

    it("enters edit mode when edit button is clicked", async () => {
        render(<MockTriedCard item={mockItem} />);
        const editBtn = screen.getByTestId("edit-btn-tried-1");

        await userEvent.click(editBtn);

        await waitFor(() => {
            expect(screen.getByTestId("notes-input-tried-1")).toBeInTheDocument();
            expect(screen.getByTestId("save-btn-tried-1")).toBeInTheDocument();
        });
    });

    it("allows editing notes", async () => {
        render(<MockTriedCard item={mockItem} />);
        const editBtn = screen.getByTestId("edit-btn-tried-1");

        await userEvent.click(editBtn);

        const textarea = screen.getByTestId("notes-input-tried-1") as HTMLTextAreaElement;
        await userEvent.clear(textarea);
        await userEvent.type(textarea, "Updated notes");

        expect(textarea.value).toBe("Updated notes");
    });

    it("saves changes when save button is clicked", async () => {
        const onUpdate = vi.fn();
        render(<MockTriedCard item={mockItem} onUpdate={onUpdate} />);

        const editBtn = screen.getByTestId("edit-btn-tried-1");
        await userEvent.click(editBtn);

        const textarea = screen.getByTestId("notes-input-tried-1") as HTMLTextAreaElement;
        await userEvent.clear(textarea);
        await userEvent.type(textarea, "New review");

        const saveBtn = screen.getByTestId("save-btn-tried-1");
        await userEvent.click(saveBtn);

        expect(onUpdate).toHaveBeenCalledWith("New review", 4.5);
    });

    it("cancels editing when cancel button is clicked", async () => {
        render(<MockTriedCard item={mockItem} />);
        const editBtn = screen.getByTestId("edit-btn-tried-1");

        await userEvent.click(editBtn);

        const cancelBtn = screen.getByTestId("cancel-btn-tried-1");
        await userEvent.click(cancelBtn);

        await waitFor(() => {
            expect(screen.getByTestId("notes-display-tried-1")).toBeInTheDocument();
        });
    });

    it("calls onDelete when remove button is clicked", async () => {
        const onDelete = vi.fn();
        render(<MockTriedCard item={mockItem} onDelete={onDelete} />);

        const removeBtn = screen.getByTestId("remove-btn-tried-1");
        await userEvent.click(removeBtn);

        expect(onDelete).toHaveBeenCalled();
    });

    it("displays 'No notes' when notes are empty", () => {
        const itemWithoutNotes = { ...mockItem, notes: "" };
        render(<MockTriedCard item={itemWithoutNotes} />);
        expect(screen.getByText("No notes")).toBeInTheDocument();
    });

    it("renders multiple cards independently", () => {
        const item1 = { ...mockItem, id: "tried-1", dishName: "Pizza" };
        const item2 = { ...mockItem, id: "tried-2", dishName: "Burger" };

        render(
            <>
                <MockTriedCard item={item1} />
                <MockTriedCard item={item2} />
            </>
        );

        expect(screen.getByText("Pizza")).toBeInTheDocument();
        expect(screen.getByText("Burger")).toBeInTheDocument();
    });
});
