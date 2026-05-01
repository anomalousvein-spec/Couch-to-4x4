import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Navigate to the app
        await page.goto("http://localhost:5174/")

        # Complete Onboarding
        await page.fill('input[type="number"]', "30")
        await page.click('button:has-text("Continue")')
        await page.click('button:has-text("Confirm")')
        await page.click('button:has-text("Starting Fresh")')

        # Wait for workout display
        await page.wait_for_selector('.workout-display')
        print("Workout started")

        # Start the workout
        await page.click('button:has-text("Start")')
        print("Clicked Start")

        # Skip Warmup phase
        await page.click('button.skip-btn')
        print("Skipped to WORK phase")

        # Now the HR HUD should be visible
        await page.wait_for_selector('.hr-hud-card')
        print("HR HUD found in WORK phase")
        await page.screenshot(path="work_phase.png")

        # Verify HR HUD text and pulse class
        hr_text = await page.inner_text('.hr-target-display')
        print(f"HR Target Text: {hr_text}")

        has_pulse = await page.eval_on_selector('.hr-target-display', 'el => el.classList.contains("pulse-active")')
        print(f"HR Target has pulse-active: {has_pulse}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
