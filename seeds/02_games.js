/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
export async function seed(knex) {
  // Deletes ALL existing entries
  await knex('games').del()
  await knex('games').insert([
    {
      id: 1,
      user_id: 1,
      title: 'The Legend of Zelda: Breath of the Wild',
      status: 'Playing',
      rating: 5,
      summary: 'Link wakes up after a century of slumber to defeat Calamity Ganon and save Hyrule in this sprawling open-world adventure.',
      coverArt: 'https://example.com/images/breath-of-the-wild.jpg',
      notes: 'Incredible open world and storytelling.',
    },
    {
      id: 2,
      user_id: 2,
      title: 'Animal Crossing: New Horizons',
      status: 'Want to Play',
      rating: 0,
      summary: 'Build and customize your own island paradise in this delightful life simulation game.',
      coverArt: 'https://example.com/images/animal-crossing.jpg',
      notes: 'Perfect for relaxing.',
    },
    {
      id: 3,
      user_id: 3,
      title: 'Dark Souls III',
      status: 'Completed',
      rating: 4,
      summary: 'Explore a dark fantasy world filled with dangerous enemies, intense combat, and mysterious lore.',
      coverArt: 'https://example.com/images/dark-souls-3.jpg',
      notes: 'Challenging but very rewarding gameplay.',
    },
  ]);
};
