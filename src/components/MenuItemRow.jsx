import React from 'react';

const MenuItemRow = ({ item, getStatusStyle }) => {
  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="p-4">
        <img
          src={item.image || 'https://via.placeholder.com/40'}
          alt={item.name}
          className="rounded w-10 h-10 object-cover"
        />
      </td>
      <td className="p-4 font-medium">{item.name}</td>
      <td className="p-4">{item.category || 'N/A'}</td>
      <td className="p-4">${Number(item.price).toFixed(2)}</td>
      <td className="p-4">
        <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusStyle(item.status)}`}>
          {item.status}
        </span>
      </td>
      <td className="p-4">
        {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'N/A'}
      </td>
      <td className="p-4 text-gray-400 cursor-pointer">⋮</td>
    </tr>
  );
};

export default MenuItemRow;
