import { expect, test } from "@playwright/test";

/**
 * Recorrido de la demo (criterio de éxito):
 * 1. Crear el bot con el asistente.
 * 2. Grabar el procedimiento (8 interacciones, incluido Trazabilidad_Diaria.xlsx).
 * 3. Editar un paso, agregar una validación y publicar.
 * 4. Ejecutar y seguir el progreso.
 * 5. Ejecutar de nuevo: falla porque "Importar información" ahora es "Procesar archivo".
 * 6. Mantenimiento: probar el selector propuesto, reemplazarlo y guardar una versión.
 * 7. Ver la versión en el historial, compararla con la anterior y restaurar.
 *
 * Each Playwright context starts with empty storage, so the demo data is seeded fresh.
 */
test("recorrido completo de la demo", async ({ page }) => {
  await test.step("1. Crear el bot con el asistente", async () => {
    await page.goto("/automations/new");
    await page.getByRole("button", { name: "Usar datos de ejemplo" }).click();
    await page.getByRole("menuitem", { name: /Trazabilidad diaria/ }).click();
    for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Siguiente" }).click();
    await expect(page.getByText("Carga de información de trazabilidad")).toBeVisible();
    await page.getByRole("button", { name: "Crear y grabar" }).click();
    await page.waitForURL(/\/recorder\//);
  });

  await test.step("2. Grabar el procedimiento", async () => {
    await page.getByRole("button", { name: "Reproducir grabación de ejemplo" }).click();
    const steps = page.getByRole("list", { name: "Pasos grabados" }).getByRole("listitem");
    await expect(steps).toHaveCount(8, { timeout: 30_000 });
    await expect(steps.filter({ hasText: "Trazabilidad_Diaria.xlsx" })).toHaveCount(1);
    await expect(page.getByText("Grabación detenida")).toBeVisible();
    await page.getByRole("button", { name: "Guardar", exact: true }).click();
    await page.waitForURL(/\/editor\//);
  });

  await test.step("3. Editar un paso, agregar una validación y publicar", async () => {
    await expect(page.locator(".react-flow__node")).toHaveCount(8);
    await page.locator(".react-flow__node", { hasText: "Seleccionar turno" }).click();
    await page.getByLabel("Nombre del paso").fill("Seleccionar turno de la mañana");
    await page.locator(".react-flow__node", { hasText: "Clic en Importar información" }).click();
    await page
      .getByRole("complementary", { name: "Biblioteca de acciones" })
      .getByRole("button", { name: "Validar texto" })
      .click();
    await expect(page.locator(".react-flow__node")).toHaveCount(9);
    await page.getByLabel("Selector", { exact: true }).fill("[data-rec-message]");
    await page.getByLabel("Texto esperado").fill("Información importada");
    await page.getByRole("button", { name: "Publicar versión" }).click();
    await page.getByLabel("Nota de cambios").fill("Versión inicial con validación del mensaje de importación.");
    await page.getByRole("dialog").getByRole("button", { name: "Publicar", exact: true }).click();
    await expect(page.getByText("versión publicada v1")).toBeVisible();
  });

  let firstExecution = "";
  await test.step("4. Ejecutar y seguir el progreso", async () => {
    await page.getByRole("button", { name: "Ejecutar", exact: true }).click();
    await page.waitForURL(/\/executions\//);
    firstExecution = page.url();
    await expect(page.getByRole("heading", { name: "Pasos" })).toBeVisible();
    await expect(page.getByText("Exitosa").first()).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText("9 de 9 pasos")).toBeVisible();
    await expect(page.getByText("El Sistema de trazabilidad se actualizó").first()).toBeVisible();
  });

  await test.step("5. Ejecutar de nuevo: falla por el cambio de etiqueta", async () => {
    await page.getByRole("button", { name: "Ejecutar de nuevo" }).click();
    await page.waitForURL((url) => url.pathname.startsWith("/executions/") && url.href !== firstExecution);
    await expect(page.getByText("La ejecución falló")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(/No se encontró el elemento "Importar información"/).first()).toBeVisible();
  });

  await test.step("6. Mantenimiento: probar, reemplazar y guardar versión", async () => {
    await page.getByRole("link", { name: "Reparar en mantenimiento" }).click();
    await page.waitForURL(/\/maintenance\//);
    await expect(page.getByText('"Procesar archivo"').first()).toBeVisible();
    await page.getByRole("button", { name: "Probar selector" }).click();
    await expect(page.getByText('Se encontró 1 elemento: "Procesar archivo".')).toBeVisible();
    await page.getByRole("button", { name: "Reemplazar" }).click();
    await expect(page.getByText("Reparación lista.")).toBeVisible();
    await page.getByRole("button", { name: "Guardar nueva versión" }).first().click();
    await page.getByRole("dialog").getByRole("button", { name: "Publicar", exact: true }).click();
    await expect(page.getByText("Versión 2 publicada")).toBeVisible();
  });

  await test.step("7. Historial: comparar y restaurar", async () => {
    await page.goto(page.url().replace("/maintenance/", "/versions/"));
    await expect(page.getByLabel("Resumen de cambios")).toContainText("1 modificados");
    await expect(page.getByText('role=button[name="Procesar archivo"]')).toBeVisible();
    const v1 = page.locator('[aria-labelledby="timeline-heading"] li').filter({ hasText: "Versión 1" });
    await v1.getByRole("button", { name: "Restaurar" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Restaurar" }).click();
    await expect(page.getByText("Se restauró la versión 1")).toBeVisible();
    await expect(page.locator('[aria-labelledby="timeline-heading"] > ol > li')).toHaveCount(3);
  });
});
