-- Migrate order items from removed statuses to «В работе»
UPDATE "order_items"
SET "status_id" = (SELECT id FROM "statuses" WHERE name = 'В работе' LIMIT 1)
WHERE "status_id" IN (
  SELECT id FROM "statuses" WHERE name IN ('К исполнению', 'Не начато')
);

DELETE FROM "statuses" WHERE name IN ('К исполнению', 'Не начато');

UPDATE "statuses" SET "sort_order" = 0 WHERE name = 'В работе';
UPDATE "statuses" SET "sort_order" = 1 WHERE name = 'Выполнено';
