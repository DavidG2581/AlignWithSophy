(function () {
  const AUTH_PROFILE_KEY = "alignWithSophyProfile";

  function getStoredProfile() {
    try {
      const raw = localStorage.getItem(AUTH_PROFILE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn("Unable to parse stored profile", error);
      return null;
    }
  }

  function storeProfile(profile) {
    if (!profile) return;
    localStorage.setItem(AUTH_PROFILE_KEY, JSON.stringify(profile));
  }

  function clearProfile() {
    localStorage.removeItem(AUTH_PROFILE_KEY);
  }

  function buildUserMenuHTML(username) {
    const safeName = username || "Member";
    return `
      <button type="button" class="user-menu-toggle">${safeName}</button>
      <div class="menu" role="menu">
        <a href="account.html" role="menuitem">Account details</a>
        <a href="members.html" role="menuitem">Membership options</a>
        <a href="account.html#payments" role="menuitem">Update payment method</a>
        <button type="button" data-action="delete" role="menuitem">Delete account</button>
        <button type="button" data-action="logout" role="menuitem">Log out</button>
      </div>
    `;
  }

  function attachMenuListeners(listItem, profile) {
    const toggle = listItem.querySelector(".user-menu-toggle");
    const menu = listItem.querySelector(".menu");

    if (!toggle || !menu) return;

    toggle.addEventListener("click", () => {
      const isOpen = listItem.classList.contains("open");
      document
        .querySelectorAll(".user-menu.open")
        .forEach((node) => node.classList.remove("open"));
      if (!isOpen) {
        listItem.classList.add("open");
      }
    });

    menu.addEventListener("click", (event) => {
      if (event.target.dataset?.action === "logout") {
        event.preventDefault();
        clearProfile();
        renderAuthNav(null);
        document.dispatchEvent(new CustomEvent("auth:logout"));
      }

      if (event.target.dataset?.action === "delete") {
        event.preventDefault();
        document.dispatchEvent(new CustomEvent("auth:delete-account", { detail: profile }));
        alert("Account deletion flow should be implemented with Cognito admin APIs.");
      }
    });
  }

  function renderAuthNav(profile) {
    const navItems = document.querySelectorAll("#nav-auth");
    navItems.forEach((item) => {
      if (!item) return;

      item.classList.remove("open");

      if (profile) {
        storeProfile(profile);
        item.classList.add("user-menu");
        item.classList.remove("login-link");
        item.innerHTML = buildUserMenuHTML(profile.username || profile.email);
        attachMenuListeners(item, profile);
      } else {
        item.classList.remove("user-menu");
        item.classList.add("login-link");
        item.innerHTML = '<a href="index.html#member-access">Login</a>';
      }
    });
  }

  document.addEventListener("click", (event) => {
    const openMenu = document.querySelector(".user-menu.open");
    if (!openMenu) return;
    if (
      !openMenu.contains(event.target) &&
      !(event.target && event.target.closest(".user-menu-toggle"))
    ) {
      openMenu.classList.remove("open");
    }
  });

  const initialProfile = getStoredProfile();
  if (initialProfile) {
    renderAuthNav(initialProfile);
  } else {
    renderAuthNav(null);
  }

  window.AuthNav = {
    getProfile: getStoredProfile,
    setProfile(profile) {
      renderAuthNav(profile);
      document.dispatchEvent(new CustomEvent("auth:login", { detail: profile }));
    },
    clearProfile() {
      clearProfile();
      renderAuthNav(null);
      document.dispatchEvent(new CustomEvent("auth:logout"));
    },
  };
})();
