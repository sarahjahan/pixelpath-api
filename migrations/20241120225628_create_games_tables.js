/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
    return knex.schema
      .createTable("games", (table) => {
        table.increments("id").primary();
        table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.string("title").notNullable().unique();
        table.string('summary');
        table.string('coverArt').notNullable();
        table.string('status').defaultTo('Want To Play');
        table.integer('rating').notNullable().defaultTo(0);
        table.text('notes');
        table.string('tags');
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table
          .timestamp("updated_at")
          .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
      });
  }
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  export function down(knex) {
    return knex.schema.dropTable("games");
  }