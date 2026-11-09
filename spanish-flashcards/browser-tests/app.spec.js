import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const vocabulary = JSON.parse(readFileSync(new URL('../src/data/vocabulary.json', import.meta.url), 'utf8'));

test('flip, rate, persist, and render without overflow', async ({ page }, info) => {
  const errors=[];page.on('pageerror', e=>errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'Mi vocabulario.'})).toBeVisible();
  const card=page.getByRole('button',{name:'Flip card: la cocina'});
  await card.focus();await page.keyboard.press('Enter');
  await expect(page.getByRole('button',{name:'Flip card: the kitchen'})).toBeVisible();
  await page.getByRole('button',{name:'Got it',exact:true}).click();
  await page.reload();await expect(page.getByText(`1 of ${vocabulary.length} marked Got it`)).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.screenshot({path:`test-results/${info.project.name}-flashcards.png`,fullPage:true});
  expect(errors).toEqual([]);
});

test('complete a quiz, retry only misses, and keep ratings separate', async ({page},info)=>{
  await page.goto('/');await page.getByRole('button',{name:'Quiz',exact:true}).click();await page.getByRole('button',{name:'Start quiz →'}).click();
  for(let i=0;i<10;i++){
    const correct=await page.evaluate(()=>JSON.parse(localStorage.getItem('spanish-flashcards:v1')).attempts.at(-1).questions[JSON.parse(localStorage.getItem('spanish-flashcards:v1')).attempts.at(-1).answers.length].correct);
    const options=page.locator('.choices button');
    if(i===0){const labels=await options.allTextContents();await options.nth(labels.findIndex(x=>x!==correct)).click();}
    else await page.getByRole('button',{name:correct,exact:true}).click();
    await expect(page.locator('.choices button.correct')).toHaveCount(1);
    if(i===0) await page.screenshot({path:`test-results/${info.project.name}-quiz.png`,fullPage:true});
    await page.getByRole('button',{name:i===9?'See results →':'Next question →'}).click();
  }
  await expect(page.getByRole('heading',{name:'9 / 10'})).toBeVisible();
  await expect(page.locator('.review li')).toHaveCount(1);
  expect(await page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('spanish-flashcards:v1')).ratings))).toEqual([]);
  await page.getByRole('button',{name:'Retry missed questions'}).click();
  await expect(page.getByText('Question 1 of 1')).toBeVisible();
});

test('create word, export and restore full backup',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:'Manage Vocabulary'}).click();await page.getByRole('button',{name:'+ Add word'}).click();
  await page.getByLabel('Spanish *').fill('la brújula');await page.getByLabel('English *').fill('the compass');await page.getByLabel('Category *').fill('Personal');await page.getByRole('button',{name:'Save word'}).click();
  await expect(page.getByRole('heading',{name:'la brújula',exact:true})).toBeVisible();
  const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Export full backup'}).click();const downloaded=await downloadPromise;const path=await downloaded.path();
  page.on('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Delete la brújula'}).click();await expect(page.getByRole('heading',{name:'la brújula',exact:true})).toHaveCount(0);
  await page.getByLabel('Restore full backup file').setInputFiles(path);await page.getByRole('button',{name:'Confirm restore'}).click();
  await expect(page.getByRole('heading',{name:'la brújula',exact:true})).toBeVisible();
});

test('fits a 320px viewport across practice and management', async ({page})=>{
  await page.setViewportSize({width:320,height:740});await page.goto('/');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Manage Vocabulary'}).click();await page.getByRole('button',{name:'+ Add word'}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});
