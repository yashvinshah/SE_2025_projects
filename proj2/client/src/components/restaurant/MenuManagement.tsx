import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";
import "./MenuManagement.css";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  category?: string;
}

const MenuManagement: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [newItem, setNewItem] = useState<Omit<MenuItem, "id">>({
    name: "",
    price: 0,
    description: "",
    category: "Main",
  });

  // Get current menu
  const { data: menu = [] } = useQuery<MenuItem[]>({
    queryKey: ["restaurantMenu", user?.id],
    queryFn: async () => {
      const response = await api.get(`/restaurant/menu?ownerId=${user?.id}`);
      return response.data.menu;
    },
    enabled: !!user,
  });

  // Update menu mutation
  const updateMenuMutation = useMutation({
    mutationFn: async (updatedMenu: MenuItem[]) => {
      const response = await api.put("/restaurant/menu", {
        ownerId: user?.id, //bug fix
        menu: updatedMenu,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurantMenu", user?.id] });
    },
  });

  const handleAddItem = () => {
    if (newItem.name && newItem.price > 0) {
      const item: MenuItem = {
        ...newItem,
        id: Date.now().toString(),
      };
      updateMenuMutation.mutate([...menu, item]);
      setNewItem({ name: "", price: 0, description: "", category: "Main" });
      setIsAddingItem(false);
    }
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setNewItem({
      name: item.name,
      price: item.price,
      description: item.description,
      category: item.category || "Main",
    });
    setIsAddingItem(true);
  };

  const handleUpdateItem = () => {
    if (editingItem && newItem.name && newItem.price > 0) {
      const updatedMenu = menu.map((item: MenuItem) =>
        item.id === editingItem.id ? { ...newItem, id: editingItem.id } : item
      );
      updateMenuMutation.mutate(updatedMenu);
      setEditingItem(null);
      setNewItem({ name: "", price: 0, description: "", category: "Main" });
      setIsAddingItem(false);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    const updatedMenu = menu.filter((item: MenuItem) => item.id !== itemId);
    updateMenuMutation.mutate(updatedMenu);
  };

  const handleCancel = () => {
    setEditingItem(null);
    setNewItem({ name: "", price: 0, description: "", category: "Main" });
    setIsAddingItem(false);
  };

  return (
    <div className="menu-management">
      <div className="menu-header">
        <h1>Menu Management</h1>
        <button
          className="btn btn-primary"
          onClick={() => setIsAddingItem(true)}
        >
          Add Menu Item
        </button>
      </div>

      {isAddingItem && (
        <div className="add-item-form">
          <h3>{editingItem ? "Edit Menu Item" : "Add New Menu Item"}</h3>
          <div className="form-group">
            <label>Item Name</label>
            <input
              type="text"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              placeholder="Enter item name"
            />
          </div>
          <div className="form-group">
            <label>Price ($)</label>
            <input
              type="number"
              step="0.01"
              value={newItem.price}
              onChange={(e) =>
                setNewItem({
                  ...newItem,
                  price: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="Enter price"
            />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select
              value={newItem.category}
              onChange={(e) =>
                setNewItem({ ...newItem, category: e.target.value })
              }
            >
              <option value="Appetizer">Appetizer</option>
              <option value="Main">Main Course</option>
              <option value="Dessert">Dessert</option>
              <option value="Beverage">Beverage</option>
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={newItem.description}
              onChange={(e) =>
                setNewItem({ ...newItem, description: e.target.value })
              }
              placeholder="Enter item description"
              rows={3}
            />
          </div>
          <div className="form-actions">
            <button
              className="btn btn-primary"
              onClick={editingItem ? handleUpdateItem : handleAddItem}
            >
              {editingItem ? "Update Item" : "Add Item"}
            </button>
            <button className="btn btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="menu-list">
        <h3>Current Menu Items</h3>
        {menu.length === 0 ? (
          <p className="no-items">
            No menu items yet. Add your first item above!
          </p>
        ) : (
          <div className="menu-items">
            {menu.map((item: MenuItem) => (
              <div key={item.id} className="menu-item">
                <div className="item-info">
                  <h4>{item.name}</h4>
                  <p className="item-price">${item.price.toFixed(2)}</p>
                  <p className="item-category">{item.category}</p>
                  <p className="item-description">{item.description}</p>
                </div>
                <div className="item-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleEditItem(item)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuManagement;
