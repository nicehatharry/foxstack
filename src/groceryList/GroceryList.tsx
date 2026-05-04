import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import styled from 'styled-components';

// --- Types ---

interface GroceryItem {
  id: string;
  item: string;
  store: string;
  department: string;
  quantity: number;
  acquired: boolean;
}

interface FormData {
  item: string;
  store: string;
  department: string;
  quantity: number;
  acquired: boolean;
}

interface SortConfig {
  key: keyof GroceryItem | null;
  direction: 'asc' | 'desc';
}

interface FilterConfig {
  department: string;
  status: 'All' | 'Acquired' | 'Pending';
}

// --- Styled Components ---

const Container = styled.div`
  max-width: 1000px;
  margin: 2rem auto;
  padding: 1rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
`;

const Header = styled.h2`
  text-align: center;
  color: #333;
  margin-bottom: 1.5rem;
`;

const Summary = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: #666;
  background: #fff;
  padding: 0.5rem 1rem;
  border-radius: 4px;
`;

const FormContainer = styled.form`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: #555;
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #6c5ce7;
    box-shadow: 0 0 0 2px rgba(108, 92, 231, 0.2);
  }
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  background: white;
`;

const Button = styled.button<{ $type?: 'delete' | 'edit' | 'submit' }>`
  padding: 0.5rem 1rem;
  background-color: ${props => props.$type === 'delete' ? '#ff7675' : props.$type === 'submit' ? '#00b894' : '#6c5ce7'};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const SubmitButton = styled(Button)`
  grid-column: 1 / -1;
  margin-top: 0.5rem;
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
`;

const Th = styled.th`
  background-color: #f1f2f6;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #2d3436;
  border-bottom: 2px solid #dfe6e9;
  cursor: pointer;
  
  &:hover {
    background-color: #e2e6ea;
  }
`;

const Td = styled.td<{ $isAcquired?: boolean }>`
  padding: 1rem;
  border-bottom: 1px solid #f1f2f6;
  color: #2d3436;
  
  ${props => props.$isAcquired && `
    text-decoration: line-through;
    color: #b2bec3;
  `}
`;

const ActionCell = styled.td`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
`;

const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  width: 18px;
  height: 18px;
  cursor: pointer;
`;

// --- Main Component ---

const GroceryList: React.FC = () => {
  // State for the list of items
  const [items, setItems] = useState<GroceryItem[]>([]);
  
  // State for the form inputs
  const [formData, setFormData] = useState<FormData>({
    item: '',
    store: '',
    department: 'Produce',
    quantity: 1,
    acquired: false
  });

  // State for editing
  const [editingId, setEditingId] = useState<string | null>(null);

  // State for sorting
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  
  // State for filters
  const [filterDept, setFilterDept] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Acquired' | 'Pending'>('All');

  const departments: string[] = ['Produce', 'Dairy', 'Bakery', 'Meat', 'Fish', 'Frozen', 'Pantry', 'Household'];

  // Load from localStorage on mount
  useEffect(() => {
    const savedItems = localStorage.getItem('groceryList');
    if (savedItems) {
      try {
        const parsed = JSON.parse(savedItems) as GroceryItem[];
        setItems(parsed);
      } catch (error) {
        console.error('Failed to parse stored grocery list:', error);
      }
    }
  }, []);

  // Save to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('groceryList', JSON.stringify(items));
  }, [items]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData.item.trim()) return;

    if (editingId) {
      // Update existing item
      setItems(items.map(item => 
        item.id === editingId ? { ...formData, id: editingId } : item
      ));
      setEditingId(null);
    } else {
      // Add new item
      const newItem: GroceryItem = {
        ...formData,
        acquired: false,
        id: Date.now().toString(),
        quantity: Number(formData.quantity)
      };
      setItems([...items, newItem]);
    }

    // Reset form
    setFormData({
      item: '',
      store: '',
      department: 'Produce',
      quantity: 1,
      acquired: false
    });
  };

  const handleEdit = (item: GroceryItem) => {
    setFormData({
      item: item.item,
      store: item.store,
      department: item.department,
      quantity: item.quantity,
      acquired: item.acquired
    });
    setEditingId(item.id);
  };

  const handleDelete = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setFormData({
        item: '',
        store: '',
        department: 'Produce',
        quantity: 1,
        acquired: false
      });
    }
  };

  const toggleAcquired = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, acquired: !item.acquired } : item
    ));
  };

  const handleSort = (key: keyof GroceryItem | null) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key){
        if (sortConfig.direction === 'desc') {
            direction = 'asc'
            key = null
        } else {
            direction = 'desc'
        }
    }
    setSortConfig({ key, direction });
  };

  // Filtering and Sorting Logic
  const processedItems = items
    .filter(item => {
      if (filterDept !== 'All' && item.department !== filterDept) return false;
      if (filterStatus === 'Acquired' && !item.acquired) return false;
      if (filterStatus === 'Pending' && item.acquired) return false;
      return true;
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      
      let aValue: string | number | boolean = a[sortConfig.key];
      let bValue: string | number | boolean = b[sortConfig.key];

      // Handle string comparison case-insensitively
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
      }
      if (typeof bValue === 'string') {
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const stats = {
    total: items.length,
    acquired: items.filter(i => i.acquired).length
  };

  return (
    <Container>
      <Header>Grocery List Manager</Header>
      
      <Summary>
        <span>Total Items: {stats.total}</span>
        <span>Acquired: {stats.acquired} / {stats.total}</span>
      </Summary>

      {/* Filters */}
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <select 
          value={filterDept} 
          onChange={(e) => setFilterDept(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          <option value="All">All Departments</option>
          {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
        </select>

        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value as 'All' | 'Acquired' | 'Pending')}
          style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          <option value="All">All Status</option>
          <option value="Acquired">Acquired Only</option>
          <option value="Pending">Pending Only</option>
        </select>
      </div>

      {/* Add/Edit Form */}
      <FormContainer onSubmit={handleSubmit}>

        <InputGroup>
          <Label>Item</Label>
          <Input 
            type="text" 
            name="item" 
            value={formData.item} 
            onChange={handleInputChange} 
            placeholder="milk" 
            required
          />
        </InputGroup>

        <InputGroup>
          <Label>Quantity</Label>
          <Input 
            type="number" 
            name="quantity" 
            value={formData.quantity} 
            onChange={handleInputChange} 
            min="1"
          />
        </InputGroup>

        <InputGroup>
          <Label>Department</Label>
          <Select 
            name="department" 
            value={formData.department} 
            onChange={handleInputChange}
          >
            {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
          </Select>
        </InputGroup>
        
        <InputGroup>
          <Label>Store</Label>
          <Input 
            type="text" 
            name="store" 
            value={formData.store} 
            onChange={handleInputChange} 
            placeholder="Aldi" 
          />
        </InputGroup>

        <SubmitButton $type="submit" type="submit">
          {editingId ? 'Update Item' : 'Add Item'}
        </SubmitButton>
      </FormContainer>

      {/* Table */}
      <TableWrapper>
        <Table>
          <thead>
            <tr>
              <Th onClick={() => handleSort('acquired')}> ✔️ {sortConfig.key === 'acquired' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</Th>
              <Th> # </Th>
              <Th onClick={() => handleSort('item')}>Item {sortConfig.key === 'item' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</Th>
              <Th onClick={() => handleSort('department')}>Department {sortConfig.key === 'department' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</Th>
              <Th onClick={() => handleSort('store')}>Store {sortConfig.key === 'store' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {processedItems.length === 0 ? (
              <tr>
                <Td $isAcquired={false} colSpan={6} style={{ textAlign: 'center', fontStyle: 'italic', color: '#888' }}>
                  List is empty. Add some groceries!
                </Td>
              </tr>
            ) : (
              processedItems.map(item => (
                <tr key={item.id}>
                  <Td $isAcquired={item.acquired}>
                    <Checkbox 
                      checked={item.acquired} 
                      onChange={() => toggleAcquired(item.id)} 
                    />
                  </Td>
                  <Td $isAcquired={item.acquired}>{item.quantity}</Td>
                  <Td $isAcquired={item.acquired}>{item.item}</Td>
                  <Td $isAcquired={item.acquired}>{item.department}</Td>
                  <Td $isAcquired={item.acquired}>{item.store}</Td>
                  <ActionCell>
                    <Button $type="edit" type="button" onClick={() => handleEdit(item)}>Edit</Button>
                    <Button $type="delete" type="button" onClick={() => handleDelete(item.id)}>Delete</Button>
                  </ActionCell>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </TableWrapper>
    </Container>
  );
};

export default GroceryList;