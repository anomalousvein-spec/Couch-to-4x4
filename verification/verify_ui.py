import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        try:
            await page.goto("http://localhost:5173", timeout=30000)
            await page.wait_for_timeout(2000)

            # Click CONTINUE (onboarding)
            await page.click("button:has-text('CONTINUE')")
            await page.wait_for_timeout(1000)
            await page.screenshot(path="verification/onboarding_2.png")

            # Keep clicking CONTINUE until we reach the dashboard
            for _ in range(5):
                try:
                    await page.click("button:has-text('CONTINUE')", timeout=2000)
                    await page.wait_for_timeout(500)
                except:
                    break

            await page.screenshot(path="verification/dashboard.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
