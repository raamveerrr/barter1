const admin = require('firebase-admin');
const serviceAccount = require('./test-service-account.json');

// Initialize admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seedTestData() {
  // Create test users
  const users = [
    {
      uid: 'test_user1',
      email: 'student1@vitap.edu.in',
      displayName: 'Test Student 1',
      coinBalance: 500,
      role: 'student'
    },
    {
      uid: 'test_user2',
      email: 'student2@vitap.edu.in',
      displayName: 'Test Student 2',
      coinBalance: 300,
      role: 'student'
    },
    {
      uid: 'admin_user',
      email: 'admin@vitap.edu.in',
      displayName: 'Admin User',
      coinBalance: 1000,
      role: 'admin'
    }
  ];

  // Create test items
  const items = [
    {
      itemId: 'item1',
      title: 'Engineering Textbook',
      description: 'Used textbook in good condition',
      category: 'Books',
      price: 200,
      ownerId: 'test_user1',
      status: 'available',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      itemId: 'item2',
      title: 'Scientific Calculator',
      description: 'TI-84 Plus, like new',
      category: 'Electronics',
      price: 300,
      ownerId: 'test_user2',
      status: 'available',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      itemId: 'item3',
      title: 'Study Desk',
      description: 'Compact desk, perfect for dorm',
      category: 'Furniture',
      price: 400,
      ownerId: 'test_user1',
      status: 'available',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
  ];

  // Create test perks
  const perks = [
    {
      perkId: 'perk1',
      title: 'Campus Cafe Coffee',
      description: 'One free coffee at the campus cafe',
      cost: 100,
      availableQuantity: 50,
      active: true
    },
    {
      perkId: 'perk2',
      title: 'Print Credits',
      description: '50 pages of printing at the library',
      cost: 150,
      availableQuantity: 100,
      active: true
    }
  ];

  // Batch write users
  const batch = db.batch();
  users.forEach(user => {
    batch.set(db.collection('users').doc(user.uid), user);
  });

  // Batch write items
  items.forEach(item => {
    batch.set(db.collection('items').doc(item.itemId), item);
  });

  // Batch write perks
  perks.forEach(perk => {
    batch.set(db.collection('perks').doc(perk.perkId), perk);
  });

  await batch.commit();
  console.log('Test data seeded successfully!');
}

// Execute seeding
seedTestData()
  .then(() => {
    console.log('Completed seeding test data');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding test data:', error);
    process.exit(1);
  });