/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
export async function seed(knex) {
    // Deletes ALL existing entries
    await knex('game_tags').del()
    await knex('game_tags').insert([
      { id: 1, game_id: 1, tag_id: 1 },
      { id: 2, game_id: 1, tag_id: 2 },
      { id: 3, game_id: 1, tag_id: 3 },
      { id: 4, game_id: 2, tag_id: 3 },
      { id: 5, game_id: 2, tag_id: 4 },
      { id: 6, game_id: 3, tag_id: 4 },
    ]);
  };
  