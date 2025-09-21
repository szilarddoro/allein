use tauri::{TitleBarStyle, WebviewUrl, WebviewWindowBuilder};

pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      let win_builder =
        WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
          .title("")
          .inner_size(1200.0, 800.0);

      // set transparent title bar only when building for macOS
      #[cfg(target_os = "macos")]
      let win_builder = win_builder.title_bar_style(TitleBarStyle::Transparent);

      let window = win_builder.build().unwrap();

      // set background color only when building for macOS
      #[cfg(target_os = "macos")]
      {
        use cocoa::appkit::{NSColor, NSWindow};
        use cocoa::base::{id, nil};

        let ns_window = window.ns_window().unwrap() as id;
        unsafe {
          let bg_color = NSColor::colorWithRed_green_blue_alpha_(
              nil,
              255.0 / 255.0,
              255.0 / 255.0,
              255.0 / 255.0,
              1.0,
          );
          ns_window.setBackgroundColor_(bg_color);
        }
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}