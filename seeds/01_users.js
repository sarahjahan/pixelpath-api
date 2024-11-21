/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
export async function seed(knex) {
  // Deletes ALL existing entries
  await knex('users').del()
  await knex('users').insert([
    {id: 1, username: 'gamer123', email: 'gamer123@example.com', password: 'hashedpassword1'},
    {id: 2, username: 'pixelFan', email: 'pixelfan@example.com', password: 'hashedpassword2'},
    {id: 3, username: 'cozyPlayer', email: 'cozyplayer@example.com', password: 'hashedpassword3'}
  ]);
};
