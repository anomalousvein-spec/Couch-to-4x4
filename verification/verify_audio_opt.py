import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        try:
            await page.goto("http://localhost:5173", timeout=30000)
            await page.wait_for_selector("button", timeout=10000)
            await page.screenshot(path="verification/dashboard.png")

            # Look for the start button - based on memory it might be technical styled
            await page.click("button:has-text('START')")
            await page.wait_for_timeout(1000)
            await page.screenshot(path="verification/workout_active.png")
        except Exception as e:
            print(f"Error during verification: {e}")
            await page.screenshot(path="verification/error.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
