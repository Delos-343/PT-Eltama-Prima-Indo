import { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import { getInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import ItemForm from './ItemForm';

const Catalog = () => {

  const [items, setItems] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {

    setIsLoading(true);
    
    try {
      const data = await getInventory();
      setItems(data);
    } catch (error) {
      toast.error('Failed to fetch inventory items');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async (itemData) => {

    try {
      await addInventoryItem(itemData);
      toast.success('Item added successfully');
      fetchItems();
      setShowAddForm(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add item');
    }
  };

  const handleUpdateItem = async (itemData) => {

    try {
      await updateInventoryItem(editingItem.id, itemData);
      toast.success('Item updated successfully');
      fetchItems();
      setEditingItem(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update item');
    }
  };

  const handleDeleteItem = async (id) => {

    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteInventoryItem(id);
        toast.success('Item deleted successfully');
        fetchItems();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete item');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
        {isAdmin && (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
          >
            Add a New Item
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="mb-6">
          <ItemForm
            onSubmit={handleAddItem}
            onCancel={() => setShowAddForm(false)}
            title="Add New Item"
          />
        </div>
      )}

      {editingItem && (
        <div className="mb-6">
          <ItemForm
            initialData={editingItem}
            onSubmit={handleUpdateItem}
            onCancel={() => setEditingItem(null)}
            title="Edit"
          />
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-600">
          No inventory items found. {isAdmin && 'Please add some items to get started.'}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                {isAdmin && (
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${parseFloat(item.price).toFixed(2)}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Catalog;