import React, { useState, useEffect, useRef, useMemo } from "react";

/* =====================================================
   LOGO (Stationery World brand mark, provided by client)
===================================================== */
import logoImg from "./assets/logo.png";
const LOGO = logoImg;

import { CATEGORIES, CATEGORY_IMAGES, NAV_LINKS, CUSTOMER_NAV, HERO_SLIDES, WHY_US, SERVICES } from "./data/siteContent.js";
import imgWriting from "./assets/products/writing.svg";
import imgArt from "./assets/products/art.svg";
import imgOffice from "./assets/products/office.svg";
import imgAdhesives from "./assets/products/adhesives.svg";
import * as authApi from "./api/auth.js";
import * as productsApi from "./api/products.js";
import * as quotationsApi from "./api/quotations.js";
import DispatchPanel from "./DispatchPanel.jsx";
import InvoicesPanel from "./InvoicesPanel.jsx";
import { AdminDashboard, PendingPanel } from "./AdminDashboard.jsx";
import { viewPdf, downloadPdf } from "./utils/pdfDoc.js";
import { exportListPdf, exportListXlsx } from "./utils/exportList.js";
import CustomerPages from "./CustomerPages.jsx";
import NewQuotation from "./NewQuotation.jsx";

/* =====================================================
   EMBEDDED STYLESHEET
===================================================== */
const STYLES = `
:root{
  --navy:#16304f; --navy-2:#20456e; --navy-3:#0d2038;
  --gold:#f5a800; --gold-2:#ffcc4d;
  --paper:#faf7f0; --paper-2:#f1ead9;
  --ink:#22303f; --ink-soft:#5b6b7a; --line:#e2d9c4;
  --ok:#2e7d4f; --danger:#b3441f;
  --radius:14px; --shadow:0 10px 30px -12px rgba(22,48,79,.25);
}
.sw-root *{box-sizing:border-box;}
.sw-root{
  font-family:'Inter',sans-serif; background:var(--paper); color:var(--ink);
  min-height:100vh; width:100%;
}
.sw-root h1,.sw-root h2,.sw-root h3,.brand-font{font-family:'Fraunces',serif;}
.mono{font-family:'JetBrains Mono',monospace;}
.sw-root img{max-width:100%;display:block;}
.sw-root button{font-family:inherit;cursor:pointer;}

/* LOGIN */
.login-screen{
  min-height:100vh; display:flex; align-items:center; justify-content:center;
  background:radial-gradient(1200px 600px at 15% -10%, #ffe8ad33, transparent 60%),
             radial-gradient(1000px 700px at 110% 110%, #16304f22, transparent 60%), var(--paper);
  padding:24px;
}
.login-card{
  width:100%; max-width:920px; background:#fff; border-radius:22px; box-shadow:var(--shadow);
  display:grid; grid-template-columns:1.05fr 1fr; overflow:hidden;
  opacity:0; transform:translateY(24px); animation:riseIn .8s cubic-bezier(.2,.8,.2,1) .1s forwards;
  border:1px solid var(--line);
}
@keyframes riseIn{to{opacity:1;transform:translateY(0);}}
.login-visual{ background:linear-gradient(160deg,var(--navy) 0%, var(--navy-3) 100%); color:#fff; padding:48px 40px;
  display:flex; flex-direction:column; justify-content:space-between; position:relative; overflow:hidden; }
.login-visual::before{ content:""; position:absolute; inset:auto -20% -40% auto; width:340px;height:340px;
  background:radial-gradient(circle, #f5a80033, transparent 70%); border-radius:50%; }
.logo-drop{ width:96px; opacity:0; transform:translateY(-14px) scale(.9);
  animation:dropIn .7s cubic-bezier(.2,.8,.2,1) .45s forwards;
  filter:drop-shadow(0 8px 18px rgba(0,0,0,.25)); background:#fff; border-radius:16px; padding:10px; }
@keyframes dropIn{to{opacity:1;transform:translateY(0) scale(1);}}
.login-visual h1{ font-size:32px; line-height:1.15; margin:26px 0 10px; font-weight:600; }
.login-visual p{ color:#cbd7e6; font-size:14.5px; line-height:1.6; max-width:34ch; }
.tick-list{ list-style:none; margin:22px 0 0; padding:0; display:flex; flex-direction:column; gap:10px; }
.tick-list li{ display:flex; gap:10px; align-items:flex-start; font-size:13.5px; color:#dfe8f2; }
.tick-list li svg{flex:none;margin-top:2px;}
.login-form-wrap{ padding:48px 44px; display:flex; flex-direction:column; justify-content:center; }
.eyebrow{ text-transform:uppercase; letter-spacing:.14em; font-size:11.5px; color:var(--gold); font-weight:700; margin-bottom:8px; }
.login-form-wrap h2{ font-size:26px; margin:0 0 6px; color:var(--navy); }
.login-form-wrap>p{ color:var(--ink-soft); font-size:14px; margin:0 0 26px; }
.field{margin-bottom:16px;}
.field label{ display:block; font-size:12.5px; font-weight:600; color:var(--navy); margin-bottom:6px; letter-spacing:.02em; }
.field label .field-hint{ font-weight:400; color:var(--ink-soft); font-size:11px; text-transform:none; letter-spacing:0; }
.field input{ width:100%; padding:12px 14px; border:1.5px solid var(--line); border-radius:10px; font-size:14.5px;
  background:#fdfbf7; transition:border-color .18s, box-shadow .18s; font-family:inherit; }
.field input:focus{ outline:none; border-color:var(--navy-2); box-shadow:0 0 0 4px #16304f14; }
.login-btn{ width:100%; padding:13px 16px; background:var(--navy); color:#fff; border:none; border-radius:10px;
  font-size:15px; font-weight:600; letter-spacing:.01em; display:flex; align-items:center; justify-content:center;
  gap:8px; transition:background .18s, transform .15s; margin-top:6px; }
.login-btn:hover{ background:var(--navy-2); transform:translateY(-1px); }
.error-msg{ color:var(--danger); font-size:13px; margin-top:10px; display:flex; align-items:center; gap:6px; }
.auth-switch{ margin-top:18px; font-size:13.5px; color:var(--ink-soft); text-align:center; }
.auth-switch button{ background:none; border:none; padding:0; color:var(--navy-2); font-weight:700; text-decoration:underline; font-size:inherit; font-family:inherit; }
.field-row{ display:grid; grid-template-columns:1fr 1fr; gap:14px; }
@media (max-width:760px){ .field-row{grid-template-columns:1fr;} }
.shake{animation:shakeAnim .4s;}
@keyframes shakeAnim{ 10%,90%{transform:translateX(-1px);} 20%,80%{transform:translateX(2px);}
  30%,50%,70%{transform:translateX(-4px);} 40%,60%{transform:translateX(4px);} }
@media (max-width:760px){ .login-card{grid-template-columns:1fr;} .login-visual,.login-form-wrap{padding:34px 28px;} }

/* APP SHELL */
.topbar{ position:sticky; top:0; z-index:40; background:var(--navy); color:#fff; padding:0 20px;
  display:flex; align-items:center; gap:18px; height:66px; box-shadow:0 4px 18px rgba(13,32,56,.25); }
.topbar .brand{display:flex;align-items:center;gap:10px;flex:none;}
.topbar .brand img{width:34px;height:34px;object-fit:contain;background:#fff;border-radius:8px;padding:3px;}
.topbar .brand span{font-family:'Fraunces',serif;font-weight:600;font-size:18px;}
.topbar .brand small{display:block;color:#b9c7d6;font-size:10px;font-weight:400;letter-spacing:.08em;text-transform:uppercase;font-family:'Inter',sans-serif;}
.searchbar-wrap{ position:relative; }
.searchbar{ width:100%; display:flex; align-items:center; gap:8px; background:#ffffff14;
  border:1px solid #ffffff26; border-radius:10px; padding:9px 14px; transition:background .2s; }
.searchbar:focus-within{background:#ffffff22;border-color:#ffffff45;}
.searchbar input{ background:transparent; border:none; outline:none; color:#fff; font-size:13.5px; width:100%; font-family:inherit; }
.searchbar input::placeholder{color:#cddaea;}
.searchbar-clear{ background:none; border:none; color:#cddaea; display:flex; padding:2px; flex:none; }
.searchbar-clear:hover{ color:#fff; }
.top-search-dropdown{ color:var(--ink); }
.topbar-right{display:flex;align-items:center;gap:14px;margin-left:auto;}
.icon-btn{ position:relative; background:#ffffff14; border:1px solid #ffffff26; border-radius:10px; width:40px;height:40px;
  display:flex;align-items:center;justify-content:center; color:#fff; transition:background .18s; flex:none; }
.icon-btn:hover{background:#ffffff26;}
.cart-badge{ position:absolute;top:-6px;right:-6px; background:var(--gold); color:var(--navy-3); font-size:10.5px;
  font-weight:700; min-width:18px;height:18px; border-radius:9px; display:flex;align-items:center;justify-content:center;
  padding:0 4px; transform:scale(0); transition:transform .25s cubic-bezier(.4,1.8,.5,1); }
.cart-badge.show{transform:scale(1);}
.cart-badge.bump{animation:bump .35s;}
@keyframes bump{50%{transform:scale(1.4);}}
.user-chip{ display:flex;align-items:center;gap:8px; background:#ffffff14;border:1px solid #ffffff26; border-radius:10px;padding:6px 12px 6px 8px; }
.user-chip .av{ width:26px;height:26px;border-radius:50%; background:var(--gold);color:var(--navy-3); font-weight:700;font-size:12px;
  display:flex;align-items:center;justify-content:center; font-family:'Fraunces',serif; }
.user-chip .info{line-height:1.15;}
.user-chip .info b{font-size:12.5px;display:block;}
.user-chip .info small{font-size:10.5px;color:#c3d1e0;}
.logout-btn{ background:none;border:none;color:#c3d1e0;font-size:11px; text-decoration:underline;text-underline-offset:2px; padding:0;margin-left:2px; }
.logout-btn:hover{color:#fff;}
.hamburger{display:none;background:none;border:none;color:#fff;width:40px;height:40px;align-items:center;justify-content:center;}
/* SECONDARY NAV */
.subnav{ background:#fff; border-bottom:1px solid var(--line); padding:0 20px; display:flex; gap:30px;
  align-items:center; height:50px; overflow-x:auto; position:sticky; top:66px; z-index:35; }
.subnav button{ background:none;border:none; font-size:13.5px;font-weight:600;color:var(--ink-soft);
  padding:6px 1px; position:relative; white-space:nowrap; }
.subnav button:hover{color:var(--navy);}
.subnav button.active{color:var(--gold);}
.subnav button.active::after{ content:"";position:absolute;left:0;right:0;bottom:-15px;height:2px;background:var(--gold); }

/* HERO BANNER */
.hero{ position:relative; background:linear-gradient(120deg,#fdf1de 0%,var(--paper) 65%);
  display:flex; align-items:center; gap:40px; padding:44px 68px; overflow:hidden; border-bottom:1px solid var(--line); }
.hero-illustration{ flex:none; width:260px; height:200px; position:relative; }
.hi-blob{ position:absolute; inset:6% 10%; background:radial-gradient(circle, var(--gold-2) 0%, transparent 70%); opacity:.4; border-radius:50%; }
.hi-icon{ position:absolute; filter:drop-shadow(0 10px 14px rgba(22,48,79,.18)); }
.hi-1{ width:120px; top:6px; left:64px; transform:rotate(-8deg); }
.hi-2{ width:64px; bottom:16px; left:2px; transform:rotate(18deg); }
.hi-3{ width:76px; top:26px; right:10px; transform:rotate(10deg); }
.hi-4{ width:56px; bottom:4px; right:44px; transform:rotate(-14deg); }
.hero-text{flex:1;min-width:0;}
.hero-text h2{font-size:29px;color:var(--navy);margin:0 0 12px;line-height:1.2;}
.hero-text p{color:var(--ink-soft);font-size:14px;line-height:1.7;max-width:56ch;margin:0;}
.hero-nav{ flex:none; background:#fff; border:1px solid var(--line); width:38px;height:38px;border-radius:50%;
  display:flex;align-items:center;justify-content:center; box-shadow:var(--shadow); color:var(--navy); }
.hero-nav:hover{background:var(--paper-2);}
@media (max-width:760px){ .hero{flex-direction:column;text-align:center;padding:32px 22px;} .hero-nav{display:none;} .hero-illustration{width:200px;height:150px;} }

/* CATALOG LAYOUT */
.catalog-layout{display:grid;grid-template-columns:224px 1fr;gap:28px;align-items:start;}
.filter-sidebar{ background:#fff;border:1px solid var(--line);border-radius:14px; padding:22px 20px; position:sticky; top:126px; }
.filter-sidebar h3{margin:0 0 14px;font-family:'Fraunces',serif;font-size:21px;color:var(--navy);}
.filter-divider{border:none;border-top:1px solid var(--line);margin:0 0 16px;}
.filter-group-title{font-size:11.5px;font-weight:700;color:var(--navy);text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px;}
.filter-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px;}
.filter-list button{background:none;border:none;text-align:left;padding:2px 0;font-size:13.5px;color:var(--ink-soft);transition:color .15s;}
.filter-list button:hover{color:var(--navy);}
.filter-list button.active{color:var(--gold);font-weight:700;}
.catalog-content{min-width:0;}
@media (max-width:900px){ .catalog-layout{grid-template-columns:1fr;} .filter-sidebar{position:static;} }

/* PRICE RANGE FILTER */
.price-filter-head{ display:flex; align-items:center; justify-content:space-between; margin-top:22px; margin-bottom:4px; cursor:pointer; user-select:none; }
.price-filter-head span.pf-label{font-family:'Fraunces',serif;font-size:15px;font-weight:700;color:var(--navy);}
.price-filter-head span.pf-toggle{ width:18px;height:18px;display:flex;align-items:center;justify-content:center;color:var(--ink-soft);font-size:16px;line-height:1;flex-shrink:0; }
.price-filter{padding-top:14px;}
.price-filter-track{ position:relative; height:4px; background:var(--line); border-radius:2px; margin:0 6px 14px; }
.price-filter-range{ position:absolute; top:0; height:4px; background:var(--navy); border-radius:2px; }
.price-filter-track input[type=range]{ position:absolute; left:-6px; right:-6px; top:-8px; height:20px; width:calc(100% + 12px); margin:0; background:transparent; -webkit-appearance:none; appearance:none; pointer-events:none; }
.price-filter-track input[type=range]::-webkit-slider-runnable-track{ -webkit-appearance:none; background:transparent; height:20px; }
.price-filter-track input[type=range]::-webkit-slider-thumb{ -webkit-appearance:none; pointer-events:all; width:16px; height:16px; border-radius:50%; background:var(--navy); border:2.5px solid #fff; box-shadow:0 1px 5px rgba(22,48,79,.4); cursor:pointer; margin-top:0; }
.price-filter-track input[type=range]::-moz-range-track{ background:transparent; height:20px; border:none; }
.price-filter-track input[type=range]::-moz-range-thumb{ pointer-events:all; width:16px; height:16px; border-radius:50%; background:var(--navy); border:2.5px solid #fff; box-shadow:0 1px 5px rgba(22,48,79,.4); cursor:pointer; }
.price-filter-labels{ display:flex; justify-content:space-between; font-size:12.5px; color:var(--ink-soft); font-weight:600; }

/* SITE FOOTER */
.site-footer{ margin-top:auto; background:var(--navy-3); color:#cddaea; }
.footer-main{ max-width:1180px; margin:0 auto; padding:48px 28px 32px; display:grid;
  grid-template-columns:1.4fr 1fr 1fr 1.2fr; gap:32px; }
.footer-brand{ display:flex; flex-direction:column; gap:14px; }
.footer-brand .fb-logo{ display:flex; align-items:center; gap:10px; }
.footer-brand .fb-logo img{ height:32px; width:auto; }
.footer-brand .fb-logo span{ font-family:'Fraunces',serif; font-size:16.5px; color:#fff; font-weight:700; }
.footer-brand p{ font-size:13px; line-height:1.7; color:#a9bbcf; margin:0; max-width:34ch; }
.footer-social{ display:flex; gap:10px; margin-top:4px; }
.footer-social a{ width:32px;height:32px;border-radius:50%;background:#ffffff12; display:flex;align-items:center;justify-content:center;
  color:#cddaea; transition:background .15s, color .15s; }
.footer-social a:hover{ background:var(--gold); color:var(--navy-3); }
.footer-col h4{ font-family:'Fraunces',serif; font-size:14.5px; color:#fff; margin:0 0 16px; font-weight:700; }
.footer-col ul{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:11px; }
.footer-col ul li button{ background:none; border:none; padding:0; font-size:13px; color:#a9bbcf; text-align:left; transition:color .15s; }
.footer-col ul li button:hover{ color:var(--gold-2); }
.footer-contact li{ display:flex; align-items:flex-start; gap:9px; font-size:13px; color:#a9bbcf; line-height:1.6; }
.footer-contact li svg{ flex-shrink:0; margin-top:2px; color:var(--gold-2); }
.footer-bottom{ border-top:1px solid #ffffff1c; }
.footer-bottom-inner{ max-width:1180px; margin:0 auto; padding:18px 28px; display:flex; align-items:center; justify-content:space-between;
  gap:14px; flex-wrap:wrap; font-size:12px; color:#8fa2b8; }
.footer-bottom-inner a{ color:#8fa2b8; }
.footer-bottom-links{ display:flex; gap:18px; flex-wrap:wrap; }
@media (max-width:820px){ .footer-main{ grid-template-columns:1fr 1fr; } }
@media (max-width:520px){ .footer-main{ grid-template-columns:1fr; padding:36px 20px 24px; } .footer-bottom-inner{ justify-content:center; text-align:center; } }

/* INFO / STATIC PAGES */
.page-header{max-width:1360px;margin:0 auto;padding:36px 20px 6px;}
.page-header h1{font-size:26px;color:var(--navy);margin:0 0 6px;}
.page-header p{color:var(--ink-soft);font-size:13.5px;margin:0;max-width:64ch;}
.info-section{max-width:1360px;margin:0 auto;padding:22px 20px 70px;}
.info-card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:32px;box-shadow:var(--shadow);max-width:760px;}
.info-card h2{color:var(--navy);font-size:20px;margin:0 0 12px;}
.info-card p{color:var(--ink-soft);font-size:14px;line-height:1.75;margin:0 0 14px;}
.stat-row{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:22px;}
.stat-box{background:var(--paper-2);border-radius:12px;padding:16px 10px;text-align:center;}
.stat-box b{display:block;font-family:'Fraunces',serif;font-size:23px;color:var(--navy);}
.stat-box span{font-size:10.5px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.04em;}
@media (max-width:640px){ .stat-row{grid-template-columns:1fr 1fr;} }

.feature-grid,.service-grid,.cat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:18px;}
.feature-card,.service-card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:22px;transition:box-shadow .2s, transform .2s;}
.feature-card:hover,.service-card:hover{box-shadow:var(--shadow);transform:translateY(-2px);}
.fc-icon{width:44px;height:44px;border-radius:10px;background:linear-gradient(135deg,var(--navy),var(--navy-2));display:flex;align-items:center;justify-content:center;margin-bottom:14px;}
.feature-card h3,.service-card h3{margin:0 0 6px;font-size:15px;color:var(--navy);}
.feature-card p,.service-card p{margin:0;font-size:12.8px;color:var(--ink-soft);line-height:1.6;}

.cat-card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:18px;display:flex;align-items:center;gap:14px;
  text-align:left;transition:box-shadow .2s, transform .2s; width:100%; }
.cat-card:hover{box-shadow:var(--shadow);transform:translateY(-2px);border-color:var(--navy-2);}
.cc-icon{width:52px;height:52px;border-radius:12px;background:linear-gradient(135deg,var(--navy),var(--navy-2));display:flex;align-items:center;justify-content:center;flex:none;}
.cc-icon img{width:30px;height:30px;}
.cat-card b{font-size:13.5px;color:var(--navy);}

.main-wrap{ flex:1; width:100%; max-width:1360px; margin:0 auto; padding:26px 20px 80px; }
.page-head{ display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:14px; margin-bottom:22px;
  opacity:0; transform:translateY(14px); transition:opacity .5s, transform .5s; }
.page-head.in{opacity:1;transform:translateY(0);}
.page-head h1{font-size:26px;margin:0 0 4px;color:var(--navy);}
.page-head p{margin:0;color:var(--ink-soft);font-size:13.5px;}
.sort-select{ border:1.5px solid var(--line);border-radius:10px;padding:9px 12px;font-size:13px; background:#fff;color:var(--navy);font-weight:600; }
.product-grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:18px; }
.pcard{ background:#fff; border:1px solid var(--line); border-radius:var(--radius); position:relative; overflow:hidden;
  opacity:0; transform:translateY(16px); animation:cardIn .55s cubic-bezier(.2,.8,.2,1) forwards;
  transition:box-shadow .22s, transform .22s; }
@keyframes cardIn{to{opacity:1;transform:translateY(0);}}
.pcard:hover{box-shadow:var(--shadow);transform:translateY(-3px);}
.pcard::after{ content:""; position:absolute;top:0;right:0; width:0;height:0; border-style:solid; border-width:0 26px 26px 0;
  border-color:transparent var(--paper-2) transparent transparent; transition:border-width .22s;
  filter:drop-shadow(-2px 2px 2px rgba(22,48,79,.12)); }
.pcard:hover::after{border-width:0 36px 36px 0;}
.ptile{ height:108px; background:#fff; display:flex;align-items:center;justify-content:center; overflow:hidden; padding:10px; }
.ptile span{ font-family:'Fraunces',serif; font-size:34px; font-weight:600; color:var(--navy); }
.ptile img{ height:100%; width:100%; object-fit:contain; transition:transform .35s ease; }
.pcard:hover .ptile img{ transform:scale(1.12); }
.pbody{padding:14px 15px 16px;}
.pcat{font-size:10.5px;text-transform:uppercase;letter-spacing:.07em;color:var(--gold);font-weight:700;margin-bottom:4px;}
.pname{font-size:14.5px;font-weight:600;color:var(--ink);margin:0 0 4px;line-height:1.3;min-height:38px;}
.punit{font-size:11.5px;color:var(--ink-soft);margin-bottom:10px;}
.pprice{font-family:'JetBrains Mono',monospace;font-size:15px;font-weight:600;color:var(--navy);margin-bottom:12px;}
.pprice small{font-size:10.5px;color:var(--ink-soft);font-weight:400;}
.qty-row{display:flex;align-items:center;gap:8px;}
.qty-ctrl{display:flex;align-items:center;border:1.5px solid var(--line);border-radius:8px;overflow:hidden;}
.qty-ctrl button{width:28px;height:30px;background:var(--paper-2);border:none;font-size:15px;color:var(--navy);font-weight:700;}
.qty-ctrl button:hover{background:var(--line);}
.qty-ctrl span{width:36px;text-align:center;font-size:13px;font-family:'JetBrains Mono',monospace;display:inline-block;}
.qty-ctrl input{width:36px;text-align:center;font-size:13px;font-family:'JetBrains Mono',monospace;display:inline-block;border:none;background:transparent;color:var(--ink);padding:0;height:30px;-moz-appearance:textfield;}
.qty-ctrl input:focus{outline:none;background:var(--paper-2);}
.add-btn{ flex:1; background:var(--navy);color:#fff;border:none;border-radius:8px; font-size:12.5px;font-weight:700;
  padding:8px 10px; transition:background .18s,transform .12s; display:flex;align-items:center;justify-content:center;gap:6px; }
.add-btn:hover{background:var(--navy-2);}
.add-btn.added{background:var(--ok);}
.add-btn:active{transform:scale(.97);}
.empty-state{text-align:center;padding:60px 20px;color:var(--ink-soft);}
.empty-state h3{color:var(--navy);margin-bottom:6px;}

/* CART DRAWER */
.overlay{ position:fixed;inset:0;background:rgba(13,32,56,.42); opacity:0;pointer-events:none;transition:opacity .25s;z-index:60; }
.overlay.show{opacity:1;pointer-events:auto;}
.drawer{ position:fixed;top:0;right:0;height:100vh;width:min(440px,100%); background:var(--paper); z-index:70;
  transform:translateX(100%); transition:transform .35s cubic-bezier(.2,.8,.2,1); display:flex;flex-direction:column;
  box-shadow:-14px 0 40px rgba(13,32,56,.25); }
.drawer.show{transform:translateX(0);}
.drawer-head{padding:20px 22px;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:space-between;}
.drawer-head h3{margin:0;font-size:19px;}
.drawer-head button{background:none;border:none;color:#fff;opacity:.8;}
.drawer-head button:hover{opacity:1;}
.drawer-body{flex:1;overflow-y:auto;padding:16px 20px;}
.cart-item{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--line);}
.ci-tile{ width:46px;height:46px;border-radius:9px;flex:none; background:linear-gradient(135deg,var(--navy),var(--navy-2));
  display:flex;align-items:center;justify-content:center;color:var(--gold-2); font-family:'Fraunces',serif;font-weight:600;font-size:17px; padding:8px; }
.ci-tile img{ width:100%;height:100%;object-fit:contain; }
.ci-info{flex:1;min-width:0;}
.ci-info .ci-name{font-size:13.5px;font-weight:600;color:var(--ink);margin-bottom:2px;}
.ci-info .ci-meta{font-size:11px;color:var(--ink-soft);margin-bottom:6px;}
.ci-remove{background:none;border:none;color:var(--danger);font-size:11px;text-decoration:underline;padding:0;}
.drawer-empty{text-align:center;color:var(--ink-soft);padding:60px 10px;}
.drawer-footer{padding:18px 20px 22px;border-top:1px solid var(--line);background:#fff;}
.df-row{display:flex;justify-content:space-between;font-size:13px;color:var(--ink-soft);margin-bottom:4px;}
.df-row.total{font-size:16px;font-weight:700;color:var(--navy);margin:8px 0 14px;}
.gen-quote-btn{ width:100%;background:var(--gold);color:var(--navy-3);border:none;border-radius:10px; padding:13px;
  font-size:14.5px;font-weight:700; transition:background .18s, transform .15s; }
.gen-quote-btn:hover{background:var(--gold-2);transform:translateY(-1px);}
.gen-quote-btn:disabled{background:var(--line);color:var(--ink-soft);cursor:not-allowed;transform:none;}
.drawer-btn-row{display:flex;gap:10px;}
.drawer-btn-row .gen-quote-btn{width:auto;flex:1;}
.place-order-btn{background:var(--navy);color:#fff;}
.place-order-btn:hover{background:var(--navy-2, var(--navy));}
.place-order-btn:disabled{background:var(--line);color:var(--ink-soft);}
.drawer-btn-row .primary-action{box-shadow:0 0 0 2px var(--navy) inset, 0 4px 10px rgba(0,0,0,.12);}
.drawer-btn-row .secondary-action{opacity:.55;}

/* QUOTATION */
.quote-wrap{max-width:840px;margin:32px auto 80px;padding:0 20px;}
.quote-toolbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:10px;}
.back-link{display:flex;align-items:center;gap:6px;background:none;border:none;color:var(--navy);font-weight:600;font-size:13.5px;}
.quote-actions{display:flex;gap:10px;}
.btn-outline{background:#fff;border:1.5px solid var(--navy);color:var(--navy);border-radius:9px;padding:9px 16px;font-size:13px;font-weight:600;}
.btn-outline:hover{background:var(--navy);color:#fff;}
.btn-solid{background:var(--navy);border:none;color:#fff;border-radius:9px;padding:9px 16px;font-size:13px;font-weight:600;}
.btn-solid:hover{background:var(--navy-2);}
.quote-paper{background:#fff;border:1px solid var(--line);border-radius:20px;box-shadow:var(--shadow);position:relative;overflow:hidden;}
.quote-head{display:flex;justify-content:space-between;align-items:stretch;padding:30px 0 0;}
.quote-brand{display:flex;align-items:center;gap:12px;padding:0 34px 20px;}
.quote-brand img{width:52px;height:52px;object-fit:contain;}
.quote-brand h2{margin:0;font-size:22px;color:var(--navy);}
.quote-brand small{color:var(--ink-soft);font-size:11.5px;display:block;letter-spacing:.03em;text-transform:uppercase;}
.quote-banner{
  background:linear-gradient(120deg,var(--navy-2),var(--navy) 65%,var(--navy-3));
  color:#fff; display:flex; align-items:center; justify-content:center;
  padding:22px 46px 22px 60px; clip-path:polygon(28px 0,100% 0,100% 100%,0 100%);
  min-width:220px; margin-left:-1px;
}
.quote-banner span{font-family:'Fraunces',serif;font-size:24px;font-weight:700;letter-spacing:.04em;}
.quote-head-line{height:4px;background:linear-gradient(90deg,var(--gold),var(--gold-2) 55%,var(--line) 90%);}
.quote-id-badge{display:flex;align-items:center;gap:10px;padding:14px 34px;border-bottom:1px solid var(--line);flex-wrap:wrap;justify-content:space-between;}
.quote-id-badge .qid-no{font-family:'JetBrains Mono',monospace;font-size:13px;color:var(--ink-soft);}
.quote-id-badge .qid-no b{color:var(--navy);font-size:15px;margin-left:6px;}
.quote-meta{padding:24px 34px;display:grid;grid-template-columns:1.2fr 1fr;gap:16px 34px;border-bottom:1px solid var(--line);}
.qm-col{display:flex;flex-direction:column;gap:16px;}
.qm-field label{display:block;font-size:10.5px;text-transform:uppercase;letter-spacing:.06em;color:var(--ink-soft);font-weight:700;margin-bottom:5px;}
.qm-field input{width:100%;border:none;border-bottom:1.5px solid var(--line);padding:5px 2px;font-size:14px;color:var(--ink);background:transparent;font-family:inherit;}
.qm-field input:focus{outline:none;border-color:var(--navy);}
.qm-field.main input{font-family:'Fraunces',serif;font-size:19px;font-weight:600;color:var(--navy);border-bottom-width:2px;}
.quote-table-wrap{padding:8px 34px 4px;overflow-x:auto;}
table.quote-table{width:100%;border-collapse:collapse;font-size:13px;}
.quote-table thead th{
  text-align:left;padding:11px 10px;background:var(--navy);color:#fff;
  font-size:10.5px;text-transform:uppercase;letter-spacing:.06em;font-weight:700;
}
.quote-table thead th:first-child{border-radius:8px 0 0 8px;}
.quote-table thead th:last-child{border-radius:0 8px 8px 0;}
.quote-table td{padding:11px 10px;border-bottom:1px solid var(--line);}
.quote-table td.num, .quote-table th.num{text-align:right;font-family:'JetBrains Mono',monospace;}
.quote-table tbody tr:nth-child(even){background:var(--paper);}
.qt-icon{width:34px;height:34px;border-radius:9px;background:var(--paper-2);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;}
.qt-item-cell{display:flex;align-items:center;gap:10px;}
.qt-name{font-weight:600;color:var(--ink);}
.qt-cat{font-size:10.5px;color:var(--ink-soft);}
.quote-table tfoot td{padding:10px 10px;border-bottom:1px solid var(--line);font-size:13px;}
.quote-table tfoot tr.qt-subtotal td, .quote-table tfoot tr.qt-tax td{text-align:right;color:var(--ink-soft);}
.quote-table tfoot tr.qt-subtotal td:first-child, .quote-table tfoot tr.qt-tax td:first-child{text-align:left;font-weight:600;color:var(--ink);}
.quote-table tfoot tr.qt-grand td{
  background:linear-gradient(90deg,var(--gold),var(--gold-2));color:var(--navy-3);
  font-weight:800;font-size:15.5px;border-bottom:none;
}
.quote-table tfoot tr.qt-grand td:first-child{text-align:left;border-radius:0 0 0 10px;}
.quote-table tfoot tr.qt-grand td:last-child{text-align:right;font-family:'JetBrains Mono',monospace;border-radius:0 0 10px 0;}
.quote-contact-row{display:flex;flex-wrap:wrap;gap:18px;padding:20px 34px 4px;}
.quote-contact-row span{display:flex;align-items:center;gap:7px;font-size:12.5px;color:var(--ink-soft);}
.quote-contact-row svg{color:var(--navy-2);}
.quote-footer{padding:26px 0 0;margin-top:18px;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;}
.quote-thankyou-bar{
  flex:1;min-width:260px;background:linear-gradient(100deg,var(--navy),var(--navy-2) 70%);color:#fff;
  padding:20px 34px;clip-path:polygon(0 0,100% 0,calc(100% - 34px) 100%,0 100%);
}
.quote-thankyou-bar span{font-family:'Fraunces',serif;font-weight:700;font-size:15px;letter-spacing:.03em;text-transform:uppercase;}
.quote-footer .signoff{text-align:right;padding:8px 34px 26px 20px;}
.quote-footer .signoff .sig-script{font-family:'Fraunces',serif;font-style:italic;font-size:22px;color:var(--navy);}
.quote-footer .signoff .line{width:150px;border-top:1.5px solid var(--ink);margin:6px 0 6px auto;}
.quote-footer .signoff b{display:block;font-size:12.5px;color:var(--ink);}
.quote-footer .signoff small{font-size:11px;color:var(--ink-soft);}
.quote-note{padding:0 34px 20px;font-size:11.5px;color:var(--ink-soft);line-height:1.6;}

@media (max-width:900px){ .searchbar-wrap{display:none;} .hamburger{display:flex;} .user-chip .info{display:none;} }
@media (max-width:640px){
  .quote-meta{grid-template-columns:1fr;} .quote-head{flex-direction:column;align-items:flex-start;}
  .quote-banner{clip-path:none;width:100%;margin-left:0;} .page-head h1{font-size:21px;}
  .quote-footer{flex-direction:column;align-items:stretch;}
  .quote-thankyou-bar{clip-path:none;} .quote-footer .signoff{text-align:left;padding:8px 34px 26px;}
  .quote-footer .signoff .line{margin:6px auto 6px 0;}
}

.toast{ position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px); background:var(--navy);color:#fff;
  padding:12px 20px;border-radius:10px;font-size:13.5px; opacity:0;transition:all .3s;z-index:100;display:flex;align-items:center;gap:8px;
  box-shadow:var(--shadow); }
.toast.show{opacity:1;transform:translateX(-50%) translateY(0);}
@media print{
  .no-print{display:none !important;}
  .sw-root{background:#fff;}
  .quote-banner, .quote-thankyou-bar, .quote-table thead th, .quote-table tfoot tr.qt-grand td{
    -webkit-print-color-adjust:exact; print-color-adjust:exact;
  }
}

/* ADMIN — PRODUCT MANAGEMENT */
.admin-toolbar{ display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:18px; flex-wrap:wrap; }
.admin-search-wrap{ position:relative; flex:1; min-width:280px; max-width:480px; }
.admin-search{ display:flex; align-items:center; gap:10px; background:#fff; border:1.5px solid var(--line);
  border-radius:16px; padding:12px 12px 12px 18px; box-shadow:0 2px 8px rgba(22,48,79,.05); }
.admin-search:focus-within{ border-color:var(--navy-2); box-shadow:0 0 0 4px #16304f14; }
.admin-search input{ flex:1; border:none; outline:none; font-size:15px; background:transparent; font-family:inherit; color:var(--ink); }
.admin-search-clear{ background:none; border:none; color:var(--ink-soft); display:flex; padding:6px; border-radius:50%; }
.admin-search-clear:hover{ background:var(--paper-2); color:var(--ink); }
.admin-search-go{ background:var(--navy); border:none; color:#fff; width:38px; height:38px; border-radius:11px;
  display:flex; align-items:center; justify-content:center; flex:none; }
.admin-search-go:hover{ background:var(--navy-2); }
.admin-search-dropdown{ position:absolute; top:calc(100% + 10px); left:0; right:0; background:#fff; border:1px solid var(--line);
  border-radius:16px; box-shadow:var(--shadow); z-index:50; overflow:hidden; }
.asd-label{ padding:14px 18px 8px; font-size:11.5px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--ink-soft); }
.asd-empty{ padding:16px 18px; font-size:13px; color:var(--ink-soft); }
.asd-item{ width:100%; display:flex; flex-direction:column; align-items:stretch; gap:10px; padding:12px 18px; background:none; border:none; text-align:left; border-bottom:1px solid var(--line); }
.asd-item:last-of-type{ border-bottom:none; }
.asd-item:hover{ background:var(--paper-2); }
.asd-item-main{ flex:1; min-width:0; display:flex; align-items:center; gap:14px; background:none; border:none; text-align:left; padding:0; cursor:pointer; }
.asd-qty-row{ display:flex; align-items:center; gap:8px; padding-left:58px; }
.asd-qty-ctrl button{ width:24px; height:26px; font-size:13px; }
.asd-qty-ctrl span{ width:30px; font-size:12px; }
.asd-add-btn{ flex:1; padding:7px 10px; font-size:12px; }
.asd-thumb{ flex:none; width:44px; height:44px; border-radius:10px; background:var(--paper-2); color:var(--navy);
  font-family:'Fraunces',serif; font-weight:700; display:flex; align-items:center; justify-content:center; font-size:16px; overflow:hidden; }
.asd-thumb img{ width:100%; height:100%; object-fit:contain; }
.asd-body{ display:flex; flex-direction:column; gap:3px; min-width:0; }
.asd-name{ font-size:14.5px; font-weight:600; color:var(--ink); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.asd-meta{ font-size:12px; color:var(--ink-soft); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.asd-footer{ width:100%; display:flex; align-items:center; gap:10px; padding:14px 18px; background:var(--paper-2);
  border:none; border-top:1px solid var(--line); font-size:13px; color:var(--navy); font-weight:600; }
.asd-footer:hover{ background:#ece3cc; }

/* Top search: compact list + hover preview panel */
.top-search-dropdown{ width:340px; right:auto; }
.asd-row{ width:100%; display:flex; align-items:center; gap:14px; padding:12px 18px; background:none; border:none;
  border-bottom:1px solid var(--line); text-align:left; cursor:pointer; color:var(--ink); }
.asd-row:last-of-type{ border-bottom:none; }
.asd-row:hover, .asd-row.active{ background:var(--paper-2); }
.asd-row .asd-body{ flex:1; min-width:0; }
.asd-row svg{ flex:none; color:var(--ink-soft); }
.asd-panel{ position:absolute; top:calc(100% + 10px); left:calc(340px + 12px); width:420px; background:#fff;
  border:1px solid var(--line); border-radius:16px; box-shadow:var(--shadow); z-index:50; padding:22px; display:flex;
  flex-direction:column; gap:16px; }
.gen-panel{ position:fixed; top:92px; left:auto; right:12px; width:clamp(380px, calc(100vw - 750px), 580px); max-height:calc(100vh - 110px); padding:0; gap:0; overflow:hidden auto; }
.gen-head, .gen-head *{ color:var(--navy); }
.gen-add{ padding:10px 16px; border-top:1px solid var(--line); background:var(--paper-2); }
.gen-add > input{ width:100%; padding:9px 12px; border:1.5px solid var(--line); border-radius:8px; font-family:inherit; font-size:14px; background:#fff; }
.gen-add-list{ max-height:220px; overflow-y:auto; margin-top:8px; background:#fff; border-radius:8px; border:1px solid var(--line); }
.gen-add-row{ display:flex; align-items:center; gap:12px; padding:8px 12px; border-bottom:1px solid var(--line); }
.gen-add-row:last-child{ border-bottom:none; }
.gen-head{ display:flex; justify-content:space-between; align-items:center; gap:10px; padding:12px 16px; background:var(--paper-2); border-bottom:1px solid var(--line); font-size:13px; }
.gen-all{ display:flex; gap:8px; align-items:center; font-weight:700; }
.gen-list{ max-height:300px; overflow-y:auto; }
.gen-row{ display:flex; align-items:center; gap:12px; padding:10px 16px; border-bottom:1px solid var(--line); }
.gen-row.off{ opacity:.5; }
.gen-row input[type=checkbox], .gen-all input{ width:18px; height:18px; accent-color:var(--navy); flex:none; }
.gen-info{ flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; }
.gen-info b{ font-size:14px; color:var(--ink); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.gen-info small{ font-size:11.5px; color:var(--ink-soft); } .gen-info small i{ font-style:normal; font-weight:700; color:var(--navy); }
.gen-info .gen-price{ color:#1c7a3e; font-weight:700; font-size:12.5px; }
.gen-qty{ width:72px; padding:7px; border:1.5px solid var(--line); border-radius:8px; text-align:center; font-family:inherit; font-size:14px; }
.gen-qty.bad{ border-color:#d33; }
.gen-foot{ display:flex; justify-content:space-between; align-items:center; gap:10px; padding:12px 16px; border-top:1px solid var(--line); font-size:13px; flex-wrap:wrap; }
.asd-panel-top{ display:flex; gap:20px; align-items:flex-start; }
.asd-panel-image{ flex:none; width:150px; height:150px; border:1px solid var(--line); border-radius:14px; background:var(--paper-2);
  display:flex; align-items:center; justify-content:center; overflow:hidden; }
.asd-panel-info{ flex:1; min-width:0; }
.asd-panel-image img{ width:100%; height:100%; object-fit:contain; padding:14px; }
.asd-panel-info h4{ margin:0 0 4px; font-family:'Fraunces',serif; font-size:19px; color:var(--navy); line-height:1.25; }
.asd-panel-brand{ font-size:13px; font-weight:600; color:var(--navy-2); margin-bottom:12px; }
.asd-panel-rows{ display:flex; flex-direction:column; gap:7px; }
.asd-panel-row{ display:grid; grid-template-columns:118px 10px 1fr; gap:6px; font-size:13px; color:var(--ink-soft); align-items:baseline; }
.asd-panel-row b{ color:var(--ink); font-weight:700; }
.asd-panel-row .asd-strike{ color:var(--ink-soft); font-weight:500; text-decoration:line-through; }
.asd-panel-row .asd-price{ color:#1c7a3e; }
.asd-panel-row .asd-stock{ display:inline-flex; align-items:center; gap:6px; color:#1c7a3e; }
.asd-panel-row .asd-stock i{ width:7px; height:7px; border-radius:50%; background:#1c7a3e; display:inline-block; }
.asd-panel-divider{ border-top:1px solid var(--line); margin:2px 0; }
.asd-panel-actions{ display:flex; align-items:center; gap:10px; padding-top:4px; border-top:1px solid var(--line); }
.asd-panel-qty{ flex:none; height:40px; }
.asd-panel-qty button{ width:34px; height:40px; font-size:16px; line-height:40px; padding:0; }
.asd-panel-qty span{ width:36px; height:40px; line-height:40px; text-align:center; font-size:14px; color:var(--ink); background:#fff; }
.asd-cart-btn{ flex:1; display:flex; align-items:center; justify-content:center; gap:8px; padding:11px 14px;
  border-radius:11px; font-size:13.5px; font-weight:700; cursor:pointer;
  background:var(--navy); border:1.5px solid var(--navy); color:#fff; }
.asd-cart-btn:hover{ background:var(--navy-2); }
.asd-cart-btn.added{ background:#1c7a3e; border-color:#1c7a3e; }
@media (max-width:900px){ .asd-panel{ display:none; } }
.admin-add-btn{ background:var(--navy); color:#fff; border:none; border-radius:10px; padding:11px 20px; font-size:14px;
  font-weight:600; white-space:nowrap; transition:background .18s, transform .15s; }
.admin-add-btn:hover{ background:var(--navy-2); transform:translateY(-1px); }
.admin-table-wrap{ background:#fff; border:1px solid var(--line); border-radius:14px; overflow-x:auto; box-shadow:0 2px 10px rgba(22,48,79,.04); }
table.admin-table{ width:100%; border-collapse:collapse; font-size:13.5px; min-width:560px; }
.admin-table-thumb{ display:flex; align-items:center; justify-content:center; width:38px; height:38px; border-radius:9px;
  background:var(--paper-2); color:var(--navy); font-weight:700; font-size:13px; overflow:hidden; }
.admin-table-thumb img{ width:100%; height:100%; object-fit:contain; }
.admin-table th{ text-align:left; padding:13px 16px; background:var(--paper-2); color:var(--navy); font-size:11px;
  text-transform:uppercase; letter-spacing:.05em; border-bottom:1px solid var(--line); }
.admin-table td{ padding:12px 16px; border-bottom:1px solid var(--line); color:var(--ink); }
.admin-table tr:last-child td{ border-bottom:none; }
.admin-table tr:hover td{ background:#faf7f0; }
.admin-empty{ text-align:center; color:var(--ink-soft); padding:34px 16px !important; }
.admin-actions{ display:flex; gap:6px; }
.admin-pw-cell{ display:flex; align-items:center; gap:8px; }
.admin-pw-cell .mono{ letter-spacing:1px; min-width:70px; display:inline-block; }
.admin-pw-toggle{ background:var(--paper-2); border:1px solid var(--line); border-radius:8px; width:30px; height:30px;
  display:flex; align-items:center; justify-content:center; color:var(--ink-soft); flex-shrink:0; }
.admin-pw-toggle:hover{ background:#ece3cc; color:var(--ink); }
.admin-actions button{ background:var(--paper-2); border:1px solid var(--line); border-radius:8px; width:32px; height:32px;
  display:flex; align-items:center; justify-content:center; font-size:14px; transition:background .15s; }
.admin-actions button:hover{ background:#ece3cc; }
.admin-pagination{ display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:18px; flex-wrap:wrap; }
.admin-pagination>button{ background:#fff; border:1.5px solid var(--line); border-radius:9px; padding:9px 16px; font-size:13px;
  font-weight:600; color:var(--navy); }
.admin-pagination>button:disabled{ opacity:.4; cursor:default; }
.admin-pagination>button:not(:disabled):hover{ border-color:var(--navy-2); }
.admin-page-numbers{ display:flex; gap:6px; }
.admin-page-numbers button{ width:34px; height:34px; border-radius:9px; border:1.5px solid var(--line); background:#fff;
  font-size:13px; font-weight:600; color:var(--ink-soft); }
.admin-page-numbers button.active{ background:var(--navy); border-color:var(--navy); color:#fff; }
.admin-page-numbers button:not(.active):hover{ border-color:var(--navy-2); color:var(--navy); }
.admin-modal-overlay{ position:fixed; inset:0; background:rgba(13,32,56,.5); display:flex; align-items:center; justify-content:center;
  z-index:200; padding:20px; }
.admin-modal{ width:100%; max-width:420px; background:#fff; border-radius:16px; box-shadow:var(--shadow); padding:26px 26px 22px;
  opacity:0; transform:translateY(14px) scale(.98); animation:riseIn .3s cubic-bezier(.2,.8,.2,1) forwards; }
.admin-modal-head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
.admin-modal-head h3{ font-size:19px; margin:0; color:var(--navy); }
.admin-modal-head button{ background:var(--paper-2); border:none; border-radius:8px; width:30px; height:30px; color:var(--ink-soft);
  display:flex; align-items:center; justify-content:center; }
.admin-modal-head button:hover{ background:var(--line); color:var(--ink); }
.pm-image-field{ display:flex; align-items:center; gap:14px; }
.pm-image-preview{ flex:none; width:64px; height:64px; border-radius:12px; background:var(--paper-2); color:var(--navy);
  display:flex; align-items:center; justify-content:center; font-weight:700; font-size:22px; overflow:hidden; border:1.5px dashed var(--line); }
.pm-image-preview img{ width:100%; height:100%; object-fit:contain; }
.pm-image-actions{ display:flex; flex-direction:column; align-items:flex-start; gap:6px; }
.pm-image-upload{ cursor:pointer; display:inline-block; padding:8px 14px; font-size:13px; }
.pm-image-remove{ background:none; border:none; color:var(--ink-soft); font-size:12.5px; text-decoration:underline; cursor:pointer; padding:0; }
.pm-image-remove:hover{ color:var(--ink); }
.admin-modal .field select{ width:100%; padding:12px 14px; border:1.5px solid var(--line); border-radius:10px; font-size:14px;
  background:#fdfbf7; font-family:inherit; color:var(--ink); }
.field-row{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.admin-modal-actions{ display:flex; justify-content:flex-end; gap:10px; margin-top:6px; }
@media (max-width:480px){ .admin-toolbar{flex-direction:column;align-items:stretch;} .admin-search-wrap{max-width:none;} .admin-add-btn{width:100%;} }

/* CUSTOMER DASHBOARD */
.dash-stats-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:22px; }
.dash-stat-card{ background:#fff; border:1px solid var(--line); border-radius:14px; padding:18px 20px;
  display:flex; flex-direction:column; gap:8px; box-shadow:0 2px 10px rgba(22,48,79,.04); }
.dash-stat-card.highlight{ background:linear-gradient(160deg,var(--navy) 0%, var(--navy-3) 100%); border-color:var(--navy); }
.dash-stat-card.highlight .dsc-label{ color:#cbd7e6; }
.dash-stat-card.highlight .dsc-value{ color:#fff; }
.dsc-label{ font-size:12px; color:var(--ink-soft); text-transform:uppercase; letter-spacing:.04em; }
.dsc-value{ font-size:26px; font-weight:700; color:var(--navy); }
.dash-grid{ display:grid; grid-template-columns:1.7fr 1fr; gap:20px; align-items:start; }
.dash-col-main,.dash-col-side{ display:flex; flex-direction:column; gap:20px; }
.admin-table th.num, .admin-table td.num{ text-align:right; }
.eq-modal{ max-width:900px; max-height:92vh; overflow:auto; }
.eq-grid{ display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:0 14px; }
.eq-scroll{ overflow-x:auto; border:1px solid var(--line); border-radius:10px; margin-top:4px; }
.eq-num{ width:84px; padding:7px 8px; border:1px solid var(--line); border-radius:8px; font-family:inherit; font-size:13px; }
.eq-add{ display:flex; gap:10px; margin-top:12px; }
.eq-add select{ flex:1; padding:9px 10px; border:1px solid var(--line); border-radius:10px; font-family:inherit; font-size:13px; min-width:0; }
.eq-actions{ display:flex; justify-content:flex-end; gap:10px; margin-top:16px; }
.eq-tag{ margin-left:8px; font-size:10.5px; font-family:inherit; background:#fff3cd; color:#8a6100; padding:2px 7px; border-radius:20px; font-weight:600; }
.eq-make-order{ background:#1c7a3e; color:#fff; border:none; border-radius:9px; padding:10px 18px; font-size:13px; font-weight:700; cursor:pointer; }
.eq-make-order:hover{ background:#16652f; }
.eq-make-order:disabled{ opacity:.6; cursor:not-allowed; }
.eq-ordered-note{ margin-top:14px; padding:10px 14px; background:#e8f5ec; color:#1c7a3e; border-radius:10px; font-size:13px; }
.eq-tag-green{ background:#e1f3e7; color:#1c7a3e; }
.order-done-banner{ display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; background:#e8f5ec; border:1px solid #b9e0c6; color:#14532d; border-radius:14px; padding:16px 20px; margin-bottom:18px; font-size:14px; line-height:1.5; }
.order-done-banner b.mono{ font-size:13px; }
.odb-actions{ display:flex; gap:10px; }
.quote-done-notice{ display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin:0 34px 14px; padding:12px 16px; background:#e8f5ec; border:1px solid #b9e0c6; color:#14532d; border-radius:10px; font-size:13.5px; }
.quote-place-row{ display:flex; align-items:center; justify-content:space-between; gap:14px; flex-wrap:wrap; background:#fff; border:1px solid var(--line); border-radius:14px; padding:16px 20px; margin-top:16px; font-size:14px; color:var(--ink); }
.quote-place-row .btn-solid, .quote-place-row .btn-outline{ padding:11px 22px; font-size:14px; }
.lk-input{ width:100%; padding:11px 14px; border:1px solid var(--line); border-radius:10px; font-size:14px; margin-bottom:12px; font-family:inherit; box-sizing:border-box; }
.lk-scroll{ max-height:380px; overflow:auto; border:1px solid var(--line); border-radius:10px; }
.lk-scroll thead th{ position:sticky; top:0; z-index:1; }
.lk-note{ font-size:12px; color:var(--ink-soft); margin-top:6px; }
.lk-result{ border:1px solid var(--line); border-radius:12px; padding:14px; margin-top:12px; overflow-x:auto; }
.lk-result-head{ display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:10px; }
.lk-totals{ display:flex; flex-wrap:wrap; gap:18px; justify-content:flex-end; margin-top:10px; font-size:13px; }
.dash-card{ background:#fff; border:1px solid var(--line); border-radius:14px; padding:20px 22px;
  box-shadow:0 2px 10px rgba(22,48,79,.04); }
.dash-card-head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; gap:10px; }
.dash-card-head h3{ font-size:17px; margin:0; color:var(--navy); }
.dash-tab-group{ display:flex; gap:8px; flex-wrap:wrap; }
.dash-tab-btn{ background:var(--paper-2); border:1.5px solid transparent; color:var(--ink-soft); border-radius:9px;
  padding:8px 14px; font-size:13px; font-weight:700; }
.dash-tabs{ display:flex; gap:8px; }
.dash-tab-btn:hover{ color:var(--navy); }
.dash-tab-btn.active{ background:var(--navy); color:#fff; }
.dash-link-btn{ background:none; border:1.5px solid var(--navy); color:var(--navy); border-radius:9px;
  padding:7px 14px; font-size:12.5px; font-weight:600; }
.dash-link-btn:hover{ background:var(--navy); color:#fff; }
.dash-empty{ color:var(--ink-soft); font-size:14px; padding:14px 0; text-align:center; }
table.dash-quote-table{ min-width:0; width:100%; table-layout:fixed; }
.dash-quote-table-wrap{ overflow-x:auto; margin:0 -22px; padding:0 22px; }
.dash-quote-table.mini th, .dash-quote-table.mini td{ padding:9px 6px; font-size:12px; word-break:break-word; }
.dash-quote-table.mini th:first-child, .dash-quote-table.mini td:first-child{ padding-left:0; }
.dash-quote-table.mini th:last-child, .dash-quote-table.mini td:last-child{ padding-right:0; }
.dash-view-btn{ background:var(--paper-2); border:1px solid var(--line); border-radius:8px; padding:6px 14px;
  font-size:12.5px; font-weight:600; color:var(--navy); }
.dash-view-btn:hover{ background:#ece3cc; }
.dash-freq-grid{ display:flex; flex-direction:column; gap:10px; }
.dash-freq-item{ display:flex; align-items:center; gap:12px; padding:8px; border-radius:10px; }
.dash-freq-item:hover{ background:var(--paper-2); }
.dfi-tile{ width:44px; height:44px; border-radius:10px; background:var(--paper-2); display:flex; align-items:center;
  justify-content:center; overflow:hidden; flex-shrink:0; font-weight:700; color:var(--navy); }
.dfi-tile img{ width:100%; height:100%; object-fit:contain; padding:5px; }
.dfi-body{ flex:1; min-width:0; }
.dfi-name{ font-size:13.5px; font-weight:600; color:var(--ink); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.dfi-meta{ font-size:12px; color:var(--ink-soft); margin-top:2px; }
.dfi-qty-ctrl{ flex:none; }
.dfi-qty-ctrl button{ width:24px; height:26px; font-size:13px; }
.dfi-qty-ctrl span{ width:26px; font-size:12px; }
.dash-freq-item .add-btn{ flex:none; padding:6px 12px; }
.dash-freq-item.compact{ padding:6px 4px; gap:6px; }
.dash-freq-item.compact .dfi-tile{ width:28px; height:28px; border-radius:7px; flex:none; }
.dash-freq-item.compact .dfi-body{ min-width:0; }
.dash-freq-item.compact .dfi-name{ font-size:11.5px; }
.dash-freq-item.compact .dfi-meta{ font-size:10px; }
.dash-freq-item.compact .dfi-qty-ctrl{ flex:none; }
.dash-freq-item.compact .dfi-qty-ctrl button{ width:18px; height:20px; font-size:11px; }
.dash-freq-item.compact .dfi-qty-ctrl span{ width:16px; font-size:10px; }
.dash-freq-item.compact .add-btn{ flex:none; padding:4px 7px; font-size:10.5px; }
.dash-account-list{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:12px; }
.dash-account-list li{ display:flex; align-items:center; justify-content:space-between; font-size:13.5px;
  padding-bottom:12px; border-bottom:1px solid var(--line); }
.dash-account-list li:last-child{ border-bottom:none; padding-bottom:0; }
.dash-account-list span{ color:var(--ink-soft); }
.dash-account-list b{ color:var(--ink); }
.dash-cart-summary-row{ display:flex; align-items:center; justify-content:space-between; font-size:14px;
  padding:6px 0; color:var(--ink-soft); }
.dash-cart-summary-row b{ color:var(--navy); font-size:15px; }
.dash-secondary-btn{ width:100%; margin-top:10px; background:#fff; border:1.5px solid var(--line); color:var(--navy);
  border-radius:10px; padding:11px 16px; font-size:13.5px; font-weight:600; }
.dash-secondary-btn:hover{ border-color:var(--navy-2); background:var(--paper-2); }
.dash-cat-bars{ display:flex; flex-direction:column; gap:14px; }
.dcb-label{ display:flex; align-items:center; justify-content:space-between; font-size:12.5px; color:var(--ink-soft); margin-bottom:6px; }
.dcb-track{ height:8px; border-radius:99px; background:var(--paper-2); overflow:hidden; }
.dcb-fill{ height:100%; border-radius:99px; background:linear-gradient(90deg,var(--gold) 0%, var(--navy-2) 100%); }
.quote-history-badge{ display:inline-block; background:var(--gold); color:var(--navy-3); font-size:11.5px;
  font-weight:700; padding:4px 10px; border-radius:99px; margin-left:10px; text-transform:uppercase; letter-spacing:.03em; }
@media (max-width:900px){ .dash-grid{grid-template-columns:1fr;} .dash-stats-grid{grid-template-columns:repeat(2,1fr);} }
`;

/* small inline icon helpers */
const IconCheck = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#f5a800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const IconArrow = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const IconWarn = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 9v4m0 4h.01M10.3 3.9L2.7 17.5A2 2 0 004.4 20.5h15.2a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" stroke="#b3441f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const IconMenu = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>);
const IconSearch = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#fff" strokeWidth="2"/><path d="M21 21l-4.3-4.3" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>);
const IconCart = () => (<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M3 4h2l2.4 12.2a2 2 0 002 1.8h8.2a2 2 0 002-1.6L21 8H6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="20" r="1.4" fill="#fff"/><circle cx="17" cy="20" r="1.4" fill="#fff"/></svg>);
const IconClose = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>);
const IconClose2 = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>);
const IconSearchDark = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#5b6b7a" strokeWidth="2"/><path d="M21 21l-4.3-4.3" stroke="#5b6b7a" strokeWidth="2" strokeLinecap="round"/></svg>);
const IconChevronRight = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const IconEye = () => (<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>);
const IconBack = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="#16304f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const IconPin = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><circle cx="12" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.8"/></svg>);
const IconPhone = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M4 5c0-.6.4-1 1-1h3l2 5-2 1.4a11 11 0 005 5L14 13l5 2v3c0 .6-.4 1-1 1C9.5 19 4 13.5 4 5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>);
const IconMail = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M3.5 6.5h17v11a1 1 0 01-1 1h-15a1 1 0 01-1-1v-11z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M4 6.5l8 6.5 8-6.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>);
const IconFacebook = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M14 21v-8h2.7l.4-3.3H14V7.6c0-.95.26-1.6 1.63-1.6H17V3.1C16.7 3.07 15.68 3 14.5 3 12 3 10.3 4.5 10.3 7.3v2.4H7.6V13h2.7v8h3.7z" fill="currentColor"/></svg>);
const IconInstagram = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor"/></svg>);
const IconLinkedin = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3.5" y="3.5" width="17" height="17" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="M8 10.5v6M8 7.8v.01M12.2 16.5v-3.4c0-1.3.9-2 2-2s1.8.8 1.8 2.1v3.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>);

/* Small decorative emoji per product category, used as the icon badge
   on each quotation line item. Falls back to a generic box. */
const CATEGORY_EMOJI = {
  "Writing Instruments": "🖊️",
  "Notebooks & Diaries": "📓",
  "Files & Folders": "📁",
  "Art & Craft": "🎨",
  "Office Supplies": "📎",
  "Adhesives & Tapes": "🧷",
  "Desk Accessories": "🗂️",
  "Computer Accessories": "🖱️",
  "Calculators": "🧮",
  "School Supplies": "🎒",
  "House Keeping": "🧹",
  "Safety Products": "🦺",
};
function categoryEmoji(catName) {
  return CATEGORY_EMOJI[catName] || "📦";
}

/* =====================================================
   MAIN APP
===================================================== */
export default function StationeryWorldApp() {
  const [view, setView] = useState("login"); // login | catalog | quote
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);

  const [loginId, setLoginId] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [loginErrorMsg, setLoginErrorMsg] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [shake, setShake] = useState(false);

  /* ---------- catalog data (served by src/api/products.js) ---------- */
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [priceBounds, setPriceBounds] = useState([0, 0]);

  const [activeCat, setActiveCat] = useState("all");
  const [search, setSearch] = useState("");
  const [topSearchOpen, setTopSearchOpen] = useState(false);
  const [hoverSuggestionId, setHoverSuggestionId] = useState(null);
  const topSearchRef = useRef(null);
  const [sort, setSort] = useState("default");
  const [priceRange, setPriceRange] = useState([0, 0]);
  const [priceOpen, setPriceOpen] = useState(true);
  const [qtyMap, setQtyMap] = useState({});
  const [cart, setCart] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [mobileSearch, setMobileSearch] = useState(false);
  const [headIn, setHeadIn] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [activeNav, setActiveNav] = useState("Shop");
  const [dashListTab, setDashListTab] = useState("quotations");
  const [checkoutIntent, setCheckoutIntent] = useState("quotation");

  /* ---------- admin: product management (src/api/products.js) ---------- */
  const [adminProducts, setAdminProducts] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminTab, setAdminTab] = useState("dashboard"); // dashboard | quotes | products | customers | dispatch | invoices | pending
  const [adminQuotes, setAdminQuotes] = useState([]);
  const [adminQuotesLoading, setAdminQuotesLoading] = useState(false);
  const [aqSearch, setAqSearch] = useState("");
  const [aqFilter, setAqFilter] = useState("all"); // all | quotation | order
  const [editingQuote, setEditingQuote] = useState(null); // draft copy being edited
  const [eqAddId, setEqAddId] = useState("");
  const [eqSaving, setEqSaving] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [revealedPwIds, setRevealedPwIds] = useState(() => new Set());
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [customerSaving, setCustomerSaving] = useState(false);
  const [cName, setCName] = useState("");
  const [cOrg, setCOrg] = useState("");
  const [cDept, setCDept] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cId, setCId] = useState("");
  const [cIdAuto, setCIdAuto] = useState(true);
  const [cPass, setCPass] = useState("");
  const [cConfirmPass, setCConfirmPass] = useState("");
  const [cError, setCError] = useState(false);
  const [cErrorMsg, setCErrorMsg] = useState("");
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminSearch, setAdminSearch] = useState("");
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [adminPage, setAdminPage] = useState(1);
  const ADMIN_PAGE_SIZE = 8;
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [pmName, setPmName] = useState("");
  const [pmCategory, setPmCategory] = useState(CATEGORIES[0].name);
  const [pmPrice, setPmPrice] = useState("");
  const [pmQty, setPmQty] = useState("");
  const [pmCustomerCode, setPmCustomerCode] = useState("");
  const [pmImage, setPmImage] = useState("");
  const adminSearchRef = useRef(null);

  const [quoteNo, setQuoteNo] = useState("");
  const [qCustomer, setQCustomer] = useState("");
  const [qOrderedBy, setQOrderedBy] = useState("");
  const [qDept, setQDept] = useState("");
  const [qDate, setQDate] = useState("");
  const [qContact, setQContact] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  /* ---------- customer dashboard (src/api/quotations.js) ---------- */
  const [quoteHistory, setQuoteHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [viewedQuote, setViewedQuote] = useState(null);
  const [lookupTab, setLookupTab] = useState("rates"); // rates | find
  const [seenOrderTick, setSeenOrderTick] = useState(0);
  const [rateSearch, setRateSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");

  /* ---------- initial load: catalog + resume any saved session ---------- */
  useEffect(() => {
    let cancelled = false;
    productsApi
      .getCatalogProducts()
      .then((list) => {
        if (cancelled) return;
        setProducts(list);
        if (list.length) {
          const prices = list.map((p) => p.price);
          const bounds = [Math.min(...prices), Math.max(...prices)];
          setPriceBounds(bounds);
          setPriceRange(bounds);
        }
      })
      .catch((err) => !cancelled && setProductsError(err.message || "Could not load the catalog."))
      .finally(() => !cancelled && setProductsLoading(false));

    const resumed = authApi.restoreSession();
    if (resumed) {
      setUser(resumed);
      setQContact(resumed.phone || "");
      setView(resumed.id === "ADMIN" ? "admin" : "dashboard");
      setActiveNav(resumed.id === "ADMIN" ? "Dashboard" : "My Dashboard");
    }
    setAuthChecking(false);

    return () => {
      cancelled = true;
    };
  }, []);

  /* Load admin table + quote history whenever the relevant user is present */
  useEffect(() => {
    if (!user || user.id !== "ADMIN") return;
    let cancelled = false;
    setAdminLoading(true);
    productsApi
      .getAdminProducts()
      .then((list) => !cancelled && setAdminProducts(list))
      .catch(() => !cancelled && setToast("Could not load products ✕"))
      .finally(() => !cancelled && setAdminLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user]);

  /* Load the customer list once the admin opens the Customers tab */
  useEffect(() => {
    if (!user || user.id !== "ADMIN" || adminTab !== "customers") return;
    let cancelled = false;
    setCustomersLoading(true);
    authApi
      .getCustomers()
      .then((list) => !cancelled && setCustomers(list))
      .catch(() => !cancelled && setToast("Could not load customers ✕"))
      .finally(() => !cancelled && setCustomersLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user, adminTab]);

  /* Admin: load every customer's quotations/orders when the Quotations tab opens */
  useEffect(() => {
    if (!user || user.id !== "ADMIN" || adminTab !== "quotes") return;
    let cancelled = false;
    setAdminQuotesLoading(true);
    quotationsApi
      .getQuotationHistory()
      .then((list) => !cancelled && setAdminQuotes(list))
      .catch(() => !cancelled && setToast("Could not load quotations ✕"))
      .finally(() => !cancelled && setAdminQuotesLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user, adminTab]);

  useEffect(() => {
    if (!user || user.id === "ADMIN") return;
    let cancelled = false;
    setHistoryLoading(true);
    quotationsApi
      .getQuotationHistory(user.id)
      .then((list) => !cancelled && setQuoteHistory(list))
      .catch(() => !cancelled && setToast("Could not load your history ✕"))
      .finally(() => !cancelled && setHistoryLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user, view === "dashboard"]);

  useEffect(() => {
    if (view === "catalog") {
      const t = setTimeout(() => setHeadIn(true), 60);
      return () => clearTimeout(t);
    }
    setHeadIn(false);
  }, [view]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    function onClickOutside(e) {
      if (adminSearchRef.current && !adminSearchRef.current.contains(e.target)) {
        setAdminDropdownOpen(false);
      }
      if (topSearchRef.current && !topSearchRef.current.contains(e.target)) {
        setTopSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  /* ---------- login ---------- */
  async function handleLogin(e) {
    e.preventDefault();
    if (loginLoading) return;
    setLoginLoading(true);
    try {
      const found = await authApi.login(loginId, loginPass);
      setUser(found);
      setQContact(found.phone || "");
      setLoginError(false);
      setLoginErrorMsg("");
      if (found.id === "ADMIN") {
        setView("admin");
        setAdminTab("dashboard");
        setActiveNav("Dashboard");
      } else {
        setView("dashboard");
        setActiveNav("My Dashboard");
      }
    } catch (err) {
      setLoginError(true);
      setLoginErrorMsg(err.message || "Invalid User ID or Password");
      setShake(true);
      setTimeout(() => setShake(false), 400);
    } finally {
      setLoginLoading(false);
    }
  }

  function handleLogout() {
    authApi.logout();
    setUser(null);
    setCart({});
    setViewedQuote(null);
    setLoginId("");
    setLoginPass("");
    setActiveCat("all");
    setActiveNav("Shop");
    setQuoteHistory([]);
    setAdminProducts([]);
    setAdminTab("products");
    setCustomers([]);
    setView("login");
  }

  const ADMIN_NAV = [
    { label: "Dashboard", tab: "dashboard" },
    { label: "Quotations", tab: "quotes", filter: "quotation" },
    { label: "Orders", tab: "quotes", filter: "order" },
    { label: "Product Items", tab: "products" },
    { label: "Invoices", tab: "invoices" },
    { label: "Dispatch", tab: "dispatch" },
    { label: "Pending", tab: "pending" },
    { label: "Customers", tab: "customers" },
  ];
  /* Export what the admin currently sees in Quotations / Orders (search + filter applied) */
  function quotesExportSpec() {
    const kind = aqFilter === "order" ? "Orders" : aqFilter === "quotation" ? "Quotations" : "Quotations & Orders";
    return {
      title: kind + " list", sheetName: kind.slice(0, 31).replace("&", "and"), filename: kind.toLowerCase().replace(/[^a-z]+/g, "-").replace(/-$/, ""),
      subtitle: adminQuoteRows.length + " records" + (aqSearch.trim() ? ' | search: "' + aqSearch.trim() + '"' : ""),
      columns: [
        { h: "No.", w: 1.5 }, { h: "Type", w: 1 }, { h: "Date", w: 1.1 }, { h: "Customer", w: 2.6 }, { h: "Customer ID", w: 1.4 },
        { h: "Ordered by", w: 1.8 }, { h: "Pieces", w: 0.8, num: true }, { h: "Subtotal (Rs.)", w: 1.4, num: true, money: true }, { h: "GST (Rs.)", w: 1.2, num: true, money: true }, { h: "Total (Rs.)", w: 1.4, num: true, money: true },
      ],
      rows: adminQuoteRows.map((q) => [q.id, q.type === "order" ? "Order" : "Quotation", q.date, q.customer, q.customerId, q.orderedBy,
        q.items.reduce((a, it) => a + Number(it.qty || 0), 0), Number(q.subtotal || 0), Number(q.gst || 0), Number(q.grand || 0)]),
      totalRow: ["Total", "", "", "", "", "", adminQuoteRows.reduce((a, q) => a + q.items.reduce((s2, it) => s2 + Number(it.qty || 0), 0), 0),
        adminQuoteRows.reduce((a, q) => a + Number(q.subtotal || 0), 0), adminQuoteRows.reduce((a, q) => a + Number(q.gst || 0), 0), adminQuoteRows.reduce((a, q) => a + Number(q.grand || 0), 0)],
    };
  }

  function goAdmin(n) {
    setActiveNav(n.label);
    setAdminTab(n.tab);
    if (n.filter) setAqFilter(n.filter);
    setViewedQuote(null);
    setView("admin");
    setMobileSearch(false);
    window.scrollTo(0, 0);
  }
  /* dashboard cards / buttons jump to a tab by its short name */
  function goAdminTab(name) {
    goAdmin(ADMIN_NAV.find((n) => n.tab === (name === "quotations" || name === "orders" ? "quotes" : name) && (name === "quotations" ? n.filter === "quotation" : name === "orders" ? n.filter === "order" : true)) || ADMIN_NAV[0]);
  }

  function viewHistoryQuote(record) {
    setViewedQuote(record);
    setView("quote");
    window.scrollTo(0, 0);
  }

  /* ---------- catalog derived list ---------- */
  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => {
      const matchesCat = activeCat === "all" || p.catId === activeCat;
      const term = search.toLowerCase().trim();
      const matchesSearch = !term || p.name.toLowerCase().includes(term) || p.catName.toLowerCase().includes(term) || (p.swCode || "").toLowerCase().includes(term) || (p.customerCode || "").toLowerCase().includes(term);
      const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
      return matchesCat && matchesSearch && matchesPrice;
    });
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "name-asc") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [activeCat, search, sort, priceRange]);

  /* On the customer's "My Orders" page the top search bar searches quotation / order numbers instead of products */
  const ordersMode = (view === "myorders" || view === "newquote" || view === "neworder") && !!user && user.id !== "ADMIN";
  useEffect(() => { setSearch(""); setTopSearchOpen(false); }, [ordersMode]);

  const topSuggestions = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return [];
    return products.filter(
      (p) => p.name.toLowerCase().includes(term) || p.catName.toLowerCase().includes(term)
    ).slice(0, 5);
  }, [search]);

  /* My Orders page only: quotations / orders matching the top search bar (number or product name) */
  const [hoverQuoteId, setHoverQuoteId] = useState(null);
  const topQuoteMatches = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!ordersMode || !term || !user) return [];
    return quoteHistory
      .filter((q) => q.customerId === user.id)
      .filter((q) =>
        [q.id, q.orderId, q.fromQuotation, q.date].some((v) => String(v || "").toLowerCase().includes(term)) ||
        (q.items || []).some((it) => String(it.name || "").toLowerCase().includes(term) || String(it.swCode || "").toLowerCase().includes(term))
      )
      .slice(0, 5);
  }, [search, quoteHistory, user, ordersMode]);
  useEffect(() => {
    if (!topQuoteMatches.length) { setHoverQuoteId(null); return; }
    if (!topQuoteMatches.some((q) => q.id === hoverQuoteId)) setHoverQuoteId(topQuoteMatches[0].id);
  }, [topQuoteMatches]);
  const previewQuote = topQuoteMatches.find((q) => q.id === hoverQuoteId) || null;

  /* Header search → pick products of an old quotation/order and Generate a brand-new quotation */
  const [genMap, setGenMap] = useState({}); // { [oldQuoteId]: [{...item, checked, qty}] }
  const [genSaving, setGenSaving] = useState(false);
  const [genAddOpen, setGenAddOpen] = useState(false);
  const [genAddTerm, setGenAddTerm] = useState("");
  useEffect(() => { setGenAddOpen(false); setGenAddTerm(""); }, [hoverQuoteId]);
  const genAddMatches = useMemo(() => {
    const t = genAddTerm.toLowerCase().trim();
    if (!genAddOpen) return [];
    const list = !t ? products : products.filter((p) => [p.name, p.catName, p.swCode, p.customerCode].some((v) => String(v || "").toLowerCase().includes(t)));
    return list.slice(0, 20);
  }, [genAddOpen, genAddTerm, products]);
  function genAddProduct(p) {
    if (!previewQuote) return;
    const cur = genMap[previewQuote.id] || previewQuote.items.map((it) => ({ ...it, checked: true, qty: Number(it.qty) }));
    const at = cur.findIndex((r) => r.id === p.id);
    const next = at >= 0
      ? cur.map((r, i) => (i === at ? { ...r, checked: true, qty: (Number(r.qty) || 0) + 1 } : r))
      : [...cur, { id: p.id, name: p.name, catName: p.catName, price: p.price, image: p.image, initial: p.initial, swCode: p.swCode, customerCode: p.customerCode, checked: true, qty: 1 }];
    setGenMap((m) => ({ ...m, [previewQuote.id]: next }));
    setToast(p.name + " added ✓");
  }
  const genRows = previewQuote
    ? (genMap[previewQuote.id] || previewQuote.items.map((it) => ({ ...it, checked: true, qty: Number(it.qty) })))
    : [];
  const setGenRowsFor = (id, rows) => setGenMap((m) => ({ ...m, [id]: rows }));
  const genChosen = genRows.filter((r) => r.checked);
  const genBadQty = genChosen.some((r) => !Number.isInteger(Number(r.qty)) || Number(r.qty) < 1);
  const genSub = genChosen.reduce((a, r) => a + Number(r.price || 0) * (Number(r.qty) || 0), 0);
  const genGst = Math.round(genSub * 0.18);

  async function generateFromSearch() {
    if (!previewQuote || genSaving) return;
    if (genChosen.length === 0) { setToast("Tick at least one product ✕"); return; }
    if (genBadQty) { setToast("Quantity must be a whole number of 1 or more ✕"); return; }
    setGenSaving(true);
    try {
      const items = genChosen.map(({ checked, discountPct, ...it }) => ({ ...it, qty: Number(it.qty) }));
      const genKind = view === "neworder" ? "order" : "quotation";
      const record = await quotationsApi.createQuotation({
        type: genKind,
        customerId: user.id,
        customer: user.org,
        orderedBy: user.name,
        dept: user.dept,
        date: new Date().toISOString().slice(0, 10),
        contact: user.phone || "",
        items,
        subtotal: genSub,
        gst: genGst,
        grand: genSub + genGst,
      });
      setQuoteHistory((prev) => [record, ...prev]);
      setGenMap({});
      setTopSearchOpen(false);
      setSearch("");
      setDashListTab(genKind === "order" ? "orders" : "quotations");
      viewHistoryQuote(record);
      setToast((genKind === "order" ? "Order " + record.id + " placed ✓" : "Quotation " + record.id + " generated ✓"));
    } catch (err) {
      setToast(err.message || "Could not generate the quotation ✕");
    } finally {
      setGenSaving(false);
    }
  }

  function pickTopQuote(q) {
    setHoverQuoteId(q.id);    // show its products on the right
  }

  useEffect(() => {
    if (!topSuggestions.length) { setHoverSuggestionId(null); return; }
    if (!topSuggestions.some((p) => p.id === hoverSuggestionId)) {
      setHoverSuggestionId(topSuggestions[0].id);
    }
  }, [topSuggestions]);

  const previewProduct = topSuggestions.find((p) => p.id === hoverSuggestionId) || null;

  function pickTopSuggestion(p) {
    setSearch(p.name);
    setTopSearchOpen(false);
    setView("catalog");
    setActiveNav("Shop");
    window.scrollTo(0, 0);
  }

  /* ---------- admin: product management ---------- */
  const adminSuggestions = useMemo(() => {
    const term = adminSearch.toLowerCase().trim();
    if (!term) return [];
    return adminProducts
      .filter((p) => p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term))
      .slice(0, 5);
  }, [adminSearch, adminProducts]);

  const adminFiltered = useMemo(() => {
    const term = adminSearch.toLowerCase().trim();
    if (!term) return adminProducts;
    return adminProducts.filter(
      (p) => p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term)
    );
  }, [adminSearch, adminProducts]);

  const adminTotalPages = Math.max(1, Math.ceil(adminFiltered.length / ADMIN_PAGE_SIZE));
  const adminPageClamped = Math.min(adminPage, adminTotalPages);
  const adminPageItems = adminFiltered.slice(
    (adminPageClamped - 1) * ADMIN_PAGE_SIZE,
    adminPageClamped * ADMIN_PAGE_SIZE
  );

  /* ---------- admin: customers ---------- */
  const customersFiltered = useMemo(() => {
    const term = customerSearch.toLowerCase().trim();
    if (!term) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.org.toLowerCase().includes(term) ||
        c.id.toLowerCase().includes(term)
    );
  }, [customerSearch, customers]);

  /* Auto-suggest a User ID from the organization (falling back to the
     name) — e.g. "RJ Enterprises Pvt. Ltd." → "RJENTERPRISE01".
     Skips IDs already in use (existing customers + the reserved ADMIN
     id) so the suggestion is always ready to submit as-is. Admin can
     still freely edit the field — see the cId input's onChange. */
  function generateCustomerId(org, name) {
    const base = (org || name || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const prefix = (base || "CUST").slice(0, 8);
    const taken = new Set(customers.map((c) => c.id.toUpperCase()));
    taken.add("ADMIN");
    for (let n = 1; n <= 99; n++) {
      const candidate = prefix + String(n).padStart(2, "0");
      if (!taken.has(candidate)) return candidate;
    }
    return prefix + Date.now().toString().slice(-4);
  }

  function resetCustomerForm() {
    setCName("");
    setCOrg("");
    setCDept("");
    setCPhone("");
    setCId("");
    setCIdAuto(true);
    setCPass("");
    setCConfirmPass("");
    setCError(false);
    setCErrorMsg("");
  }

  function openAddCustomerModal() {
    setEditingCustomerId(null);
    resetCustomerForm();
    setCustomerModalOpen(true);
  }

  function openEditCustomerModal(c) {
    setEditingCustomerId(c.id);
    setCName(c.name);
    setCOrg(c.org);
    setCDept(c.dept);
    setCPhone(c.phone);
    setCId(c.id);
    setCIdAuto(false);
    setCPass("");
    setCConfirmPass("");
    setCError(false);
    setCErrorMsg("");
    setCustomerModalOpen(true);
  }

  function closeCustomerModal() {
    if (customerSaving) return;
    setCustomerModalOpen(false);
  }

  async function saveCustomer(e) {
    e.preventDefault();
    if (customerSaving) return;

    const isEdit = editingCustomerId != null;

    if (cPass || cConfirmPass || !isEdit) {
      if (cPass !== cConfirmPass) {
        setCError(true);
        setCErrorMsg("Passwords do not match.");
        return;
      }
      if (cPass.length < 4) {
        setCError(true);
        setCErrorMsg("Password should be at least 4 characters.");
        return;
      }
    }

    setCustomerSaving(true);
    try {
      if (isEdit) {
        const updated = await authApi.updateCustomer(editingCustomerId, {
          password: cPass || undefined,
          name: cName,
          org: cOrg,
          dept: cDept,
          phone: cPhone,
        });
        setCustomers((prev) => prev.map((c) => (c.id === editingCustomerId ? updated : c)));
        setToast("Customer updated ✓");
      } else {
        const created = await authApi.createCustomer({
          id: cId,
          password: cPass,
          name: cName,
          org: cOrg,
          dept: cDept,
          phone: cPhone,
        });
        setCustomers((prev) => [created, ...prev]);
        setToast("Customer added ✓");
      }
      setCustomerModalOpen(false);
      resetCustomerForm();
      setEditingCustomerId(null);
    } catch (err) {
      setCError(true);
      setCErrorMsg(err.message || "Could not save customer. Please try again.");
    } finally {
      setCustomerSaving(false);
    }
  }

  async function deleteCustomer(c) {
    if (!window.confirm(`Remove "${c.name}" (${c.id})? This cannot be undone.`)) return;
    try {
      await authApi.deleteCustomer(c.id);
      setCustomers((prev) => prev.filter((x) => x.id !== c.id));
      setToast("Customer removed ✓");
    } catch (err) {
      setToast(err.message || "Could not remove customer ✕");
    }
  }

  function togglePasswordVisible(id) {
    setRevealedPwIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleAdminSearchChange(v) {
    setAdminSearch(v);
    setAdminDropdownOpen(true);
    setAdminPage(1);
  }

  function pickAdminSuggestion(p) {
    setAdminSearch(p.name);
    setAdminDropdownOpen(false);
    setAdminPage(1);
  }

  function openAddModal() {
    setEditingProductId(null);
    setPmName("");
    setPmCategory(CATEGORIES[0].name);
    setPmPrice("");
    setPmQty("");
    setPmCustomerCode("");
    setPmImage("");
    setProductModalOpen(true);
  }

  function openEditModal(p) {
    setEditingProductId(p.id);
    setPmName(p.name);
    setPmCategory(p.category);
    setPmPrice(String(p.price));
    setPmQty(String(p.qty));
    setPmCustomerCode(p.customerCode || "");
    setPmImage(p.image || "");
    setProductModalOpen(true);
  }

  function closeProductModal() {
    setProductModalOpen(false);
  }

  /* Reads a chosen file and turns it into a base64 data URL, which
     is stored (and sent to the API) as an ordinary string in the
     product's `image` field — no separate upload endpoint needed. */
  function handleProductImageFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow choosing the same file again later
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setToast("Please choose an image file ✕");
      return;
    }
    if (file.size > 1.5 * 1024 * 1024) {
      setToast("Image is too large — please choose one under 1.5MB ✕");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPmImage(reader.result);
    reader.onerror = () => setToast("Could not read that image ✕");
    reader.readAsDataURL(file);
  }

  async function saveProduct(e) {
    e.preventDefault();
    if (adminSaving) return;
    const name = pmName.trim();
    const price = Number(pmPrice);
    const qty = Number(pmQty);
    if (!name || !Number.isFinite(price) || !Number.isFinite(qty)) return;
    setAdminSaving(true);
    try {
      const image = pmImage.trim();
      if (editingProductId != null) {
        const updated = await productsApi.updateProduct(editingProductId, { name, category: pmCategory, price, qty, image, customerCode: pmCustomerCode.trim() });
        setAdminProducts((prev) => prev.map((p) => (p.id === editingProductId ? { ...p, ...updated } : p)));
        setToast("Product updated ✓");
      } else {
        const created = await productsApi.createProduct({ name, category: pmCategory, price, qty, image, customerCode: pmCustomerCode.trim() });
        setAdminProducts((prev) => [...prev, created]);
        setToast("Product added ✓");
      }
      setProductModalOpen(false);
    } catch (err) {
      setToast(err.message || "Could not save product ✕");
    } finally {
      setAdminSaving(false);
    }
  }

  /* ---------- admin: edit customer quotations / orders ---------- */
  function openEditQuote(q) {
    setEditingQuote(JSON.parse(JSON.stringify(q)));
    setEqAddId("");
  }
  function closeEditQuote() {
    setEditingQuote(null);
  }
  function eqSetField(field, value) {
    setEditingQuote((d) => ({ ...d, [field]: value }));
  }
  function eqSetItem(idx, field, value) {
    setEditingQuote((d) => ({ ...d, items: d.items.map((it, i) => (i === idx ? { ...it, [field]: value } : it)) }));
  }
  function eqRemoveItem(idx) {
    setEditingQuote((d) => ({ ...d, items: d.items.filter((_, i) => i !== idx) }));
  }
  function eqAddItem() {
    const p = adminProducts.find((pp) => pp.id === Number(eqAddId));
    if (!p) return;
    setEditingQuote((d) => {
      if (d.items.some((it) => it.id === p.id)) {
        return { ...d, items: d.items.map((it) => (it.id === p.id ? { ...it, qty: Number(it.qty) + 1 } : it)) };
      }
      return {
        ...d,
        items: [...d.items, { id: p.id, name: p.name, catName: p.category, price: p.price, image: p.image, initial: p.initial, swCode: p.swCode, customerCode: p.customerCode, qty: 1 }],
      };
    });
    setEqAddId("");
  }
  async function saveEditedQuote(makeOrder = false) {
    if (eqSaving || !editingQuote) return;
    const bad = editingQuote.items.some((it) => !Number.isInteger(Number(it.qty)) || Number(it.qty) < 1 || !Number.isFinite(Number(it.price)) || Number(it.price) < 0 || Number(it.discountPct || 0) < 0 || Number(it.discountPct || 0) > 100);
    if (editingQuote.items.length === 0) { setToast("A quotation needs at least one item ✕"); return; }
    if (bad) { setToast("Check the rates, quantities (1 or more) and discounts (0–100%) ✕"); return; }
    setEqSaving(true);
    try {
      const { id, customer, orderedBy, dept, contact, date, items } = editingQuote;
      if (makeOrder && !window.confirm(`Save these changes and make an order from ${id}? The customer will be told their order is done.`)) {
        setEqSaving(false);
        return;
      }
      const updated = await quotationsApi.updateQuotation(id, { customer, orderedBy, dept, contact, date, items });
      if (makeOrder) {
        const { order, quotation } = await quotationsApi.makeOrderFromQuotation(id);
        setAdminQuotes((prev) => [order, ...prev.map((q) => (q.id === id ? { ...q, ...updated, ...quotation } : q))]);
        setEditingQuote(null);
        setToast(`Order ${order.id} created — the customer can now see it ✓`);
      } else {
        setAdminQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, ...updated } : q)));
        setEditingQuote(null);
        setToast("Saved — the customer will see the updated " + (updated.type === "order" ? "order" : "quotation") + " ✓");
      }
    } catch (err) {
      setToast(err.message || "Could not save changes ✕");
    } finally {
      setEqSaving(false);
    }
  }

  async function deleteProduct(p) {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await productsApi.deleteProduct(p.id);
      setAdminProducts((prev) => prev.filter((x) => x.id !== p.id));
      setToast("Product deleted ✓");
    } catch (err) {
      setToast(err.message || "Could not delete product ✕");
    }
  }

  function stepQty(id, delta) {
    setQtyMap((prev) => {
      const cur = prev[id] || 1;
      return { ...prev, [id]: Math.max(1, cur + delta) };
    });
  }

  function setQtyDirect(id, value) {
    const digitsOnly = value.replace(/[^0-9]/g, "");
    const n = digitsOnly === "" ? 1 : Math.max(1, parseInt(digitsOnly, 10));
    setQtyMap((prev) => ({ ...prev, [id]: n }));
  }

  function selectAllOnFocus(e) {
    const el = e.target;
    setTimeout(() => el.select(), 0);
  }

  function addToCart(id) {
    const qty = Math.max(1, qtyMap[id] || 1);
    setCart((prev) => ({ ...prev, [id]: qty }));
    setToast("Added to your quotation selection ✓");
  }

  function removeFromCart(id) {
    setCart((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  const cartIds = Object.keys(cart).filter((id) => cart[id] > 0);
  const cartCount = cartIds.reduce((s, id) => s + cart[id], 0);
  const cartTotal = cartIds.reduce((s, id) => {
    const p = products.find((pp) => pp.id === parseInt(id));
    return s + p.price * cart[id];
  }, 0);

  /* ---------- quotation ---------- */
  function buildQuoteItems() {
    return cartIds.map((id) => {
      const p = products.find((pp) => pp.id === parseInt(id));
      return { id: p.id, name: p.name, catName: p.catName, price: p.price, image: p.image, initial: p.initial, swCode: p.swCode, customerCode: p.customerCode, qty: cart[id] };
    });
  }

  async function submitCart(kind) {
    if (submitLoading) return;
    setSubmitLoading(true);
    const newDate = new Date().toISOString().slice(0, 10);
    const payload = {
      type: kind === "order" ? "order" : "quotation",
      customerId: user.id,
      customer: user.org,
      orderedBy: user.name,
      dept: user.dept,
      date: newDate,
      contact: user.phone || qContact,
      items: buildQuoteItems(),
      subtotal,
      gst,
      grand,
    };
    try {
      const record = await quotationsApi.createQuotation(payload);
      setQuoteHistory((prev) => [record, ...prev]);
      setViewedQuote(null);
      setQuoteNo(record.id);
      setQCustomer(user.org);
      setQOrderedBy(user.name);
      setQDept(user.dept);
      setQDate(newDate);
      setQContact(user.phone || qContact);
      setDrawerOpen(false);
      setView("quote");
      window.scrollTo(0, 0);
      setToast(kind === "order" ? "Order placed successfully ✓" : "Quotation generated ✓");
    } catch (err) {
      setToast(err.message || "Could not submit — please try again ✕");
    } finally {
      setSubmitLoading(false);
    }
  }

  function generateQuotation() {
    submitCart("quotation");
  }

  /* Turn a past quotation into an order with one click (customer view). */
  const placedOrderForViewed = viewedQuote && viewedQuote.type !== "order"
    ? quoteHistory.find((q) => q.type === "order" && (q.fromQuotation === viewedQuote.id || q.id === viewedQuote.orderId))
    : null;

  async function placeOrderFromQuotation() {
    if (!viewedQuote || viewedQuote.type === "order" || submitLoading) return;
    if (!window.confirm(`Place an order for all items in ${viewedQuote.id}?`)) return;
    setSubmitLoading(true);
    try {
      const src = viewedQuote;
      const payload = {
        type: "order",
        customerId: src.customerId,
        customer: src.customer,
        orderedBy: src.orderedBy,
        dept: src.dept,
        date: new Date().toISOString().slice(0, 10),
        contact: src.contact,
        items: src.items.map((it) => ({ ...it })),
        subtotal: src.subtotal,
        gst: src.gst,
        ...(src.discount ? { discount: src.discount } : {}),
        grand: src.grand,
        fromQuotation: src.id,
      };
      const record = await quotationsApi.createQuotation(payload);
      setQuoteHistory((prev) => [record, ...prev]);
      setViewedQuote(record);
      setDashListTab("orders");
      window.scrollTo(0, 0);
      setToast("Order placed successfully ✓");
    } catch (err) {
      setToast(err.message || "Could not place the order — please try again ✕");
    } finally {
      setSubmitLoading(false);
    }
  }

  function startNewQuotation() {
    setCart({});
    setViewedQuote(null);
    setQContact(user ? user.phone || "" : "");
    setView("catalog");
  }

  const subtotal = cartIds.reduce((s, id) => {
    const p = products.find((pp) => pp.id === parseInt(id));
    return s + p.price * cart[id];
  }, 0);
  const gst = Math.round(subtotal * 0.18);
  const grand = subtotal + gst;

  const inr = (n) => "₹" + n.toLocaleString("en-IN");
  /* Line amount after an optional per-item discount (%) */
  const lineAmt = (it) => Math.round(Number(it.price || 0) * Number(it.qty || 0) * (1 - (Number(it.discountPct) || 0) / 100) * 100) / 100;

  /* ---------- customer dashboard: derived data ---------- */
  const customerQuotes = useMemo(
    () => (user ? quoteHistory.filter((q) => q.customerId === user.id) : []),
    [quoteHistory, user]
  );

  const customerQuotationsOnly = useMemo(
    () => customerQuotes.filter((q) => q.type !== "order"),
    [customerQuotes]
  );
  const customerOrdersOnly = useMemo(
    () => customerQuotes.filter((q) => q.type === "order"),
    [customerQuotes]
  );
  const dashListItems = dashListTab === "orders" ? customerOrdersOnly : customerQuotationsOnly;

  const adminQuoteRows = useMemo(() => {
    const term = aqSearch.trim().toLowerCase();
    return adminQuotes
      .filter((q) => aqFilter === "all" || (aqFilter === "order" ? q.type === "order" : q.type !== "order"))
      .filter(
        (q) =>
          !term ||
          q.id.toLowerCase().includes(term) ||
          (q.customer || "").toLowerCase().includes(term) ||
          (q.orderedBy || "").toLowerCase().includes(term) ||
          (q.customerId || "").toLowerCase().includes(term)
      )
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.id < b.id ? 1 : -1));
  }, [adminQuotes, aqSearch, aqFilter]);

  /* Orders the admin made from this customer's quotations that they haven't acknowledged yet */
  const seenKey = user ? "sw_seen_orders_" + user.id : "";
  const newAdminOrders = useMemo(() => {
    if (!user || user.id === "ADMIN") return [];
    let seen = [];
    try { seen = JSON.parse(localStorage.getItem(seenKey) || "[]"); } catch { seen = []; }
    return customerQuotes.filter((q) => q.type === "order" && q.createdByAdmin && !seen.includes(q.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerQuotes, user, seenOrderTick]);
  function markOrderSeen(id) {
    try {
      const seen = JSON.parse(localStorage.getItem(seenKey) || "[]");
      if (!seen.includes(id)) localStorage.setItem(seenKey, JSON.stringify([...seen, id]));
    } catch { /* storage unavailable — banner simply reappears next time */ }
    setSeenOrderTick((n) => n + 1);
  }

  /* Rate check: every product, filterable by name / category / SW code / customer code */
  const rateRows = useMemo(() => {
    const term = rateSearch.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.catName.toLowerCase().includes(term) ||
        (p.swCode || "").toLowerCase().includes(term) ||
        (p.customerCode || "").toLowerCase().includes(term)
    );
  }, [products, rateSearch]);

  /* Find an order / quotation by its number (only this customer's own records) */
  const foundRecords = useMemo(() => {
    const term = orderSearch.trim().toLowerCase();
    if (!term) return [];
    const exact = customerQuotes.find((q) => q.id.toLowerCase() === term);
    if (exact) return [exact]; // full number typed → just that one order
    return customerQuotes.filter((q) => q.id.toLowerCase().includes(term)).slice(0, 3);
  }, [customerQuotes, orderSearch]);

  const dashStats = useMemo(() => {
    const totalQuotes = customerQuotes.length;
    const totalItems = customerQuotes.reduce((s, q) => s + q.items.reduce((a, it) => a + it.qty, 0), 0);
    const totalValue = customerQuotes.reduce((s, q) => s + q.grand, 0);
    return { totalQuotes, totalItems, totalValue };
  }, [customerQuotes]);

  const topProducts = useMemo(() => {
    const map = {};
    customerQuotes.forEach((q) => q.items.forEach((it) => { map[it.id] = (map[it.id] || 0) + it.qty; }));
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([id, qty]) => ({ product: products.find((p) => p.id === parseInt(id)), qty }))
      .filter((x) => x.product);
  }, [customerQuotes]);

  const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyExpense = useMemo(() => {
    const map = {};
    customerQuotes.forEach((q) => {
      const d = new Date(q.date + "T00:00:00");
      const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
      const label = MONTH_LABELS[d.getMonth()] + " " + d.getFullYear();
      if (!map[key]) map[key] = { key, label, total: 0 };
      map[key].total += q.grand;
    });
    const rows = Object.values(map).sort((a, b) => (a.key < b.key ? 1 : -1)).slice(0, 6).reverse();
    const max = Math.max(...rows.map((r) => r.total), 1);
    return rows.map((r) => ({ ...r, pct: Math.round((r.total / max) * 100) }));
  }, [customerQuotes]);

  const mrpVsSwPrice = useMemo(() => {
    const map = {};
    customerQuotes.forEach((q) => q.items.forEach((it) => {
      const p = products.find((pp) => pp.id === it.id);
      if (!p) return;
      if (!map[it.id]) map[it.id] = { name: it.name, qty: 0, mrpTotal: 0, swTotal: 0 };
      map[it.id].qty += it.qty;
      map[it.id].mrpTotal += p.mrp * it.qty;
      map[it.id].swTotal += it.price * it.qty;
    }));
    const rows = Object.values(map)
      .map((r) => ({ ...r, savings: r.mrpTotal - r.swTotal, savePct: r.mrpTotal > 0 ? Math.round(((r.mrpTotal - r.swTotal) / r.mrpTotal) * 100) : 0 }))
      .sort((a, b) => b.savings - a.savings)
      .slice(0, 6);
    const totals = rows.reduce((acc, r) => ({ mrpTotal: acc.mrpTotal + r.mrpTotal, swTotal: acc.swTotal + r.swTotal }), { mrpTotal: 0, swTotal: 0 });
    return { rows, totals };
  }, [customerQuotes]);

  /* ---------- quote view: live cart vs. a viewed historical record ---------- */
  const qItems = viewedQuote
    ? viewedQuote.items
    : cartIds.map((id) => {
        const p = products.find((pp) => pp.id === parseInt(id));
        return { id: p.id, name: p.name, catName: p.catName, price: p.price, swCode: p.swCode, customerCode: p.customerCode, qty: cart[id] };
      });
  const qHasDisc = qItems.some((it) => Number(it.discountPct) > 0);
  const qFootSpan = qHasDisc ? 7 : 6; // # · SW code · Customer code · Product · Unit price · Qty (· Disc.)
  const qDiscountTotal = Math.round(qItems.reduce((s, it) => s + (Number(it.price) * Number(it.qty) - lineAmt(it)), 0) * 100) / 100;
  const qDisplayNo = viewedQuote ? viewedQuote.id : quoteNo;
  const qDocType = viewedQuote ? viewedQuote.type : (quoteNo.startsWith("SW-O-") ? "order" : "quotation");
  const qContactDisplay = viewedQuote ? viewedQuote.contact : qContact;
  const qSubtotal = viewedQuote ? viewedQuote.subtotal : subtotal;
  const qGst = viewedQuote ? viewedQuote.gst : gst;
  const qGrand = viewedQuote ? viewedQuote.grand : grand;

  /* =====================================================
     RENDER
  ===================================================== */
  if (authChecking) {
    return (
      <div className="sw-root">
        <style>{STYLES}</style>
        <div className="login-screen" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ color: "#5b6b7a", fontFamily: "Inter, sans-serif", fontSize: 15 }}>Loading…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="sw-root">
      <style>{STYLES}</style>

      {view === "login" && (
        <div className="login-screen">
          <div className={"login-card" + (shake ? " shake" : "")}>
            <div className="login-visual">
              <div>
                <img className="logo-drop" src={LOGO} alt="Stationery World logo" />
                <h1>The complete stationery<br />ordering portal for your team.</h1>
                <p>A secure catalog and quotation workspace built for Stationery World's registered customers — search 1,000+ products and raise a quotation in minutes.</p>
              </div>
              <ul className="tick-list">
                <li><IconCheck /> Secure, unique login for every organization</li>
                <li><IconCheck /> Digital catalog with images &amp; descriptions</li>
                <li><IconCheck /> Auto-formatted quotation, ready to share</li>
              </ul>
            </div>
            <div className="login-form-wrap">
              <div className="eyebrow">Customer Login</div>
              <h2>Welcome back</h2>
              <p>Sign in with the User ID and Password issued to you by Stationery World.</p>
              <form onSubmit={handleLogin} autoComplete="off">
                <div className="field">
                  <label htmlFor="userId">User ID</label>
                  <input type="text" id="userId" placeholder="e.g. RJENT01" value={loginId} onChange={(e) => setLoginId(e.target.value)} required />
                </div>
                <div className="field">
                  <label htmlFor="userPass">Password</label>
                  <input type="password" id="userPass" placeholder="••••••••" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} required />
                </div>
                <button type="submit" className="login-btn" disabled={loginLoading}>
                  {loginLoading ? "Signing in…" : (<>Sign In <IconArrow /></>)}
                </button>
                {loginError && (
                  <div className="error-msg"><IconWarn /> {loginErrorMsg || "Invalid User ID or Password."} Please try again.</div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {view !== "login" && view !== "quote" && user && (
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
          <div className="topbar">
            <button className="hamburger" onClick={() => setMobileSearch((s) => !s)} aria-label="Menu"><IconMenu /></button>
            <div className="brand">
              <img src={LOGO} alt="Stationery World" />
              <span>Stationery World<br /><small>Customer Ordering Portal</small></span>
            </div>
            <div className="searchbar-wrap" ref={topSearchRef} style={mobileSearch ? { position: "absolute", left: 0, right: 0, top: 66, margin: "0 12px", zIndex: 50, display: "block" } : { flex: 1, maxWidth: 520 }}>
              <div className="searchbar">
                <IconSearch />
                <input
                  type="text"
                  placeholder={ordersMode ? "Search by quotation / order number or product name" : "Search 1,000+ products — pens, files, art supplies…"}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setTopSearchOpen(true);
                    if (ordersMode) return;
                    setView("catalog"); setActiveNav("Shop");
                  }}
                  onFocus={() => setTopSearchOpen(true)}
                />
                {search && (
                  <button type="button" className="searchbar-clear" aria-label="Clear search"
                    onClick={() => { setSearch(""); setTopSearchOpen(false); }}>
                    <IconClose2 />
                  </button>
                )}
              </div>
              {!ordersMode && topSearchOpen && search.trim() && (
                <div className="admin-search-dropdown top-search-dropdown">
                  <div className="asd-label">Products</div>
                  {topSuggestions.length === 0 ? (
                    <div className="asd-empty">No matching products</div>
                  ) : (
                    topSuggestions.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className={"asd-row" + (p.id === hoverSuggestionId ? " active" : "")}
                        onMouseEnter={() => setHoverSuggestionId(p.id)}
                        onFocus={() => setHoverSuggestionId(p.id)}
                        onClick={() => setHoverSuggestionId(p.id)}
                      >
                        <span className="asd-thumb">
                          {p.image ? <img src={p.image} alt="" /> : p.initial}
                        </span>
                        <span className="asd-body">
                          <span className="asd-name">{p.name}</span>
                          <span className="asd-meta">{p.catName} • ₹{p.price}</span>
                        </span>
                        <IconChevronRight />
                      </button>
                    ))
                  )}
                  <button className="asd-footer" onClick={() => setTopSearchOpen(false)}>
                    <IconSearchDark /> Search all "{search}"
                  </button>
                </div>
              )}

              {ordersMode && topSearchOpen && search.trim() && (
                <div className="admin-search-dropdown top-search-dropdown">
                  <div className="asd-label">Quotations &amp; Orders</div>
                  {topQuoteMatches.length === 0 ? (
                    <div className="asd-empty">No matching quotation or order</div>
                  ) : (
                    topQuoteMatches.map((q) => (
                      <button
                        key={q.id}
                        type="button"
                        className={"asd-row" + (q.id === hoverQuoteId ? " active" : "")}
                        onMouseEnter={() => setHoverQuoteId(q.id)}
                        onFocus={() => setHoverQuoteId(q.id)}
                        onClick={() => pickTopQuote(q)}
                      >
                        <span className="asd-thumb">{q.type === "order" ? "O" : "Q"}</span>
                        <span className="asd-body">
                          <span className="asd-name">{q.id}</span>
                          <span className="asd-meta">{q.type === "order" ? "Order" : "Quotation"} • {q.date} • ₹{Number(q.grand || 0).toFixed(2)}</span>
                        </span>
                        <IconChevronRight />
                      </button>
                    ))
                  )}
                  <button className="asd-footer" onClick={() => setTopSearchOpen(false)}>
                    <IconSearchDark /> Search all "{search}"
                  </button>
                </div>
              )}

              {ordersMode && topSearchOpen && search.trim() && previewQuote && (
                <div className="asd-panel gen-panel">
                  <div className="gen-head">
                    <label className="gen-all">
                      <input type="checkbox" checked={genRows.length > 0 && genChosen.length === genRows.length}
                        onChange={(e) => setGenRowsFor(previewQuote.id, genRows.map((r) => ({ ...r, checked: e.target.checked })))} />
                      Select all
                    </label>
                    <span><b>{previewQuote.id}</b> · {previewQuote.type === "order" ? "Order" : "Quotation"} · {previewQuote.date}</span>
                  </div>
                  <div className="gen-list">
                    {genRows.map((r, i) => {
                      const bad = r.checked && (!Number.isInteger(Number(r.qty)) || Number(r.qty) < 1);
                      const upd = (patch) => setGenRowsFor(previewQuote.id, genRows.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
                      return (
                        <div className={"gen-row" + (r.checked ? "" : " off")} key={r.id + "-" + i}>
                          <input type="checkbox" checked={r.checked} onChange={(e) => upd({ checked: e.target.checked })} aria-label={"Select " + r.name} />
                          <span className="asd-thumb">{r.image ? <img src={r.image} alt="" /> : (r.initial || r.name.charAt(0))}</span>
                          <span className="gen-info">
                            <b>{r.name}</b>
                            <small>SW Code: <i>{r.swCode || "—"}</i> · Customer Code: <i>{r.customerCode || "—"}</i></small>
                            <small className="gen-price">₹{Number(r.price || 0).toLocaleString("en-IN")} each</small>
                          </span>
                          <input className={"gen-qty" + (bad ? " bad" : "")} type="number" min="1" step="1" placeholder="Qty" value={r.qty} disabled={!r.checked}
                            onChange={(e) => upd({ qty: e.target.value === "" ? "" : Number(e.target.value) })} />
                        </div>
                      );
                    })}
                  </div>
                  {genAddOpen && (
                    <div className="gen-add">
                      <input type="text" autoFocus placeholder="Search a product to add — name, SW code or customer code" value={genAddTerm} onChange={(e) => setGenAddTerm(e.target.value)} />
                      <div className="gen-add-list">
                        {genAddMatches.length === 0 ? <div className="asd-empty">No matching product</div> : genAddMatches.map((p) => (
                          <div className="gen-add-row" key={p.id}>
                            <span className="asd-thumb">{p.image ? <img src={p.image} alt="" /> : p.initial}</span>
                            <span className="gen-info">
                              <b>{p.name}</b>
                              <small>SW Code: <i>{p.swCode || "—"}</i> · Customer Code: <i>{p.customerCode || "—"}</i></small>
                              <small className="gen-price">₹{Number(p.price || 0).toLocaleString("en-IN")}</small>
                            </span>
                            <button type="button" className="btn-outline" onClick={() => genAddProduct(p)}>+ Add</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="gen-foot">
                    <span>{genChosen.length} of {genRows.length} selected · Total <b>₹{(genSub + genGst).toLocaleString("en-IN")}</b> <small>(incl. GST)</small></span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button type="button" className="btn-outline" onClick={() => setGenAddOpen((o) => !o)}>{genAddOpen ? "Close" : "+ Add more"}</button>
                      <button type="button" className="btn-outline" onClick={() => { setTopSearchOpen(false); setSearch(""); viewHistoryQuote(previewQuote); }}>View</button>
                      <button type="button" className="btn-solid" disabled={genSaving || genChosen.length === 0} onClick={generateFromSearch}>{genSaving ? "Please wait…" : (view === "neworder" ? "Place Order" : "Generate")}</button>
                    </div>
                  </div>
                </div>
              )}

              {!ordersMode && topSearchOpen && search.trim() && previewProduct && (
                <div className="asd-panel">
                  <div className="asd-panel-top">
                  <div className="asd-panel-image">
                    {previewProduct.image ? <img src={previewProduct.image} alt="" /> : previewProduct.initial}
                  </div>
                  <div className="asd-panel-info">
                    <h4>{previewProduct.name}</h4>
                    <div className="asd-panel-brand">Brand: {previewProduct.brand}</div>

                    <div className="asd-panel-rows">
                      <div className="asd-panel-row"><span>SW Item Code</span><span>:</span><b>{previewProduct.swCode}</b></div>
                      <div className="asd-panel-row"><span>Customer Item Code</span><span>:</span><b>{previewProduct.customerCode || "—"}</b></div>
                      <div className="asd-panel-row"><span>Category</span><span>:</span><b>{previewProduct.catName}</b></div>
                    </div>
                    <div className="asd-panel-divider" />
                    <div className="asd-panel-rows">
                      <div className="asd-panel-row"><span>MRP Price</span><span>:</span><b className="asd-strike">₹{previewProduct.mrp.toFixed(2)}</b></div>
                      <div className="asd-panel-row"><span>SW Price</span><span>:</span><b className="asd-price">₹{previewProduct.price.toFixed(2)}</b></div>
                      <div className="asd-panel-row"><span>Discount</span><span>:</span><b className="asd-price">{previewProduct.discountPct}% OFF</b></div>
                    </div>
                    {(previewProduct.tipSize || previewProduct.packSize) && (
                      <>
                        <div className="asd-panel-divider" />
                        <div className="asd-panel-rows">
                          {previewProduct.tipSize && (
                            <div className="asd-panel-row"><span>Tip Size (for pen)</span><span>:</span><b>{previewProduct.tipSize}</b></div>
                          )}
                          <div className="asd-panel-row"><span>Pack Size</span><span>:</span><b>{previewProduct.packSize}</b></div>
                        </div>
                      </>
                    )}
                    <div className="asd-panel-divider" />
                    <div className="asd-panel-rows">
                      <div className="asd-panel-row">
                        <span>Stock Status</span><span>:</span>
                        <b className="asd-stock"><i />{previewProduct.inStock ? "In Stock" : "Out of Stock"}</b>
                      </div>
                    </div>
                  </div>
                  </div>

                  <div className="asd-panel-actions">
                    <div className="qty-ctrl asd-panel-qty">
                      <button type="button" onClick={() => stepQty(previewProduct.id, -1)}>−</button>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={String(qtyMap[previewProduct.id] || 1)}
                        onChange={(e) => setQtyDirect(previewProduct.id, e.target.value)}
                        onFocus={selectAllOnFocus}
                        onClick={selectAllOnFocus}
                      />
                      <button type="button" onClick={() => stepQty(previewProduct.id, 1)}>+</button>
                    </div>
                    <button
                      type="button"
                      className={"asd-cart-btn" + (cart[previewProduct.id] ? " added" : "")}
                      onClick={() => addToCart(previewProduct.id)}
                    >
                      <IconCart /> {cart[previewProduct.id] ? `Added (${cart[previewProduct.id]})` : "Add to Cart"}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="topbar-right">
              <button className="icon-btn" onClick={() => setDrawerOpen(true)} aria-label="Cart">
                <IconCart />
                <span className={"cart-badge" + (cartCount > 0 ? " show" : "")}>{cartCount}</span>
              </button>
              <div className="user-chip">
                <div className="av" style={user.id !== "ADMIN" ? { cursor: "pointer" } : undefined} title={user.id !== "ADMIN" ? "My Profile" : undefined}
                  onClick={() => { if (user.id !== "ADMIN") { setActiveNav("My Profile"); setViewedQuote(null); setView("profile"); window.scrollTo(0, 0); } }}>{user.name.charAt(0)}</div>
                <div className="info"><b>{user.name}</b><small>{user.org}</small></div>
                <button className="logout-btn" onClick={handleLogout}>Sign out</button>
              </div>
            </div>
          </div>

          <div className="subnav">
            {user?.id !== "ADMIN" && (
              <button
                className={activeNav === "My Dashboard" ? "active" : ""}
                onClick={() => { setActiveNav("My Dashboard"); setViewedQuote(null); setView("dashboard"); setMobileSearch(false); window.scrollTo(0, 0); }}
              >
                My Dashboard
              </button>
            )}
            {user?.id === "ADMIN" ? ADMIN_NAV.map((n) => (
              <button
                key={n.label}
                className={view === "admin" && activeNav === n.label ? "active" : ""}
                onClick={() => goAdmin(n)}
              >
                {n.label}
              </button>
            )) : CUSTOMER_NAV.map((link) => (
              <button
                key={link.label}
                className={activeNav === link.label ? "active" : ""}
                onClick={() => {
                  setActiveNav(link.label);
                  setViewedQuote(null);
                  setView(link.view);
                  if (link.cat) setActiveCat(link.cat);
                  else if (link.view === "catalog") setActiveCat("all");
                  setMobileSearch(false);
                  window.scrollTo(0, 0);
                }}
              >
                {link.label}
              </button>
            ))}
          </div>

          {(view === "home" || view === "catalog") && (
            <div className="hero">
              <button className="hero-nav prev" aria-label="Previous"
                onClick={() => setHeroIndex((i) => (i - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}>
                <IconBack />
              </button>
              <div className="hero-illustration">
                <div className="hi-blob" />
                <img className="hi-icon hi-1" src={imgArt} alt="" />
                <img className="hi-icon hi-2" src={imgWriting} alt="" />
                <img className="hi-icon hi-3" src={imgOffice} alt="" />
                <img className="hi-icon hi-4" src={imgAdhesives} alt="" />
              </div>
              <div className="hero-text">
                <h2>{HERO_SLIDES[heroIndex].title}</h2>
                <p>{HERO_SLIDES[heroIndex].body}</p>
              </div>
              <button className="hero-nav next" aria-label="Next"
                onClick={() => setHeroIndex((i) => (i + 1) % HERO_SLIDES.length)}>
                <IconArrow />
              </button>
            </div>
          )}

          {view === "home" && (
            <div className="main-wrap">
              <div className="page-header" style={{ padding: 0, marginBottom: 20 }}>
                <h1>Shop by Category</h1>
                <p>Jump straight into the section you need — every category below is stocked and ready for your next order.</p>
              </div>
              <div className="cat-grid">
                {CATEGORIES.map((c) => (
                  <button key={c.id} className="cat-card"
                    onClick={() => { setActiveNav("Shop"); setView("catalog"); setActiveCat(c.id); window.scrollTo(0, 0); }}>
                    <div className="cc-icon"><img src={CATEGORY_IMAGES[c.id]} alt="" /></div>
                    <b>{c.name}</b>
                  </button>
                ))}
              </div>
            </div>
          )}

          {view === "dashboard" && user && (
            <div className="main-wrap">
              <div className="page-header" style={{ padding: 0, marginBottom: 20 }}>
                <h1>Welcome back, {user.name.split(" ")[0]}</h1>
                <p>{user.org} · {user.dept} — here's a snapshot of your ordering activity.</p>
              </div>

              {newAdminOrders.map((o) => (
                <div className="order-done-banner" key={o.id}>
                  <div>
                    <b>🎉 Your order is done!</b>
                    <div>Your quotation{o.fromQuotation ? " " + o.fromQuotation : ""} has been confirmed as Order <b className="mono">{o.id}</b> ({inr(o.grand)}). Our team will contact you for delivery.</div>
                  </div>
                  <div className="odb-actions">
                    <button className="btn-solid" onClick={() => { markOrderSeen(o.id); viewHistoryQuote(o); }}>View Order</button>
                    <button className="btn-outline" onClick={() => markOrderSeen(o.id)}>Dismiss</button>
                  </div>
                </div>
              ))}

              <div className="dash-stats-grid">
                <div className="dash-stat-card">
                  <span className="dsc-label">Quotations Generated</span>
                  <span className="dsc-value mono">{dashStats.totalQuotes}</span>
                </div>
                <div className="dash-stat-card">
                  <span className="dsc-label">Items Ordered (lifetime)</span>
                  <span className="dsc-value mono">{dashStats.totalItems}</span>
                </div>
                <div className="dash-stat-card">
                  <span className="dsc-label">Total Quoted Value</span>
                  <span className="dsc-value mono">{inr(dashStats.totalValue)}</span>
                </div>
                <div className="dash-stat-card highlight">
                  <span className="dsc-label">In Your Current Selection</span>
                  <span className="dsc-value mono">{cartCount} item{cartCount === 1 ? "" : "s"}</span>
                </div>
              </div>

              <div className="dash-grid">
                <div className="dash-col-main">
                  <div className="dash-card">
                    <div className="dash-card-head">
                      <div className="dash-tab-group">
                        <button className={"dash-tab-btn" + (lookupTab === "rates" ? " active" : "")} onClick={() => setLookupTab("rates")}>Check Product Rates</button>
                        <button className={"dash-tab-btn" + (lookupTab === "find" ? " active" : "")} onClick={() => setLookupTab("find")}>Find Order / Quotation</button>
                      </div>
                    </div>

                    {lookupTab === "rates" && (
                      <div>
                        <input
                          className="lk-input"
                          type="text"
                          placeholder="Search by product name, SW Item Code or Customer Item Code…"
                          value={rateSearch}
                          onChange={(e) => setRateSearch(e.target.value)}
                        />
                        <div className="lk-scroll">
                          <table className="admin-table">
                            <thead><tr><th>SW Item Code</th><th>Customer Item Code</th><th>Product</th><th>Unit</th><th className="num">MRP</th><th className="num">Your Rate</th></tr></thead>
                            <tbody>
                              {rateRows.length === 0 ? (
                                <tr><td colSpan={6} className="admin-empty">No products match your search.</td></tr>
                              ) : (
                                rateRows.map((p) => (
                                  <tr key={p.id}>
                                    <td className="mono">{p.swCode}</td>
                                    <td className="mono">{p.customerCode || "—"}</td>
                                    <td>{p.name}</td>
                                    <td>{p.unit}</td>
                                    <td className="mono num"><s style={{ color: "var(--ink-soft)" }}>₹{p.mrp}</s></td>
                                    <td className="mono num"><b>₹{p.price}</b></td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                        <div className="lk-note">{rateRows.length} of {products.length} products</div>
                      </div>
                    )}

                    {lookupTab === "find" && (
                      <div>
                        <input
                          className="lk-input"
                          type="text"
                          placeholder="Enter Order No. or Quote No. (e.g. SW-O-000012)"
                          value={orderSearch}
                          onChange={(e) => setOrderSearch(e.target.value)}
                        />
                        {!orderSearch.trim() ? (
                          <div className="dash-empty">Type an order or quotation number to see all its details.</div>
                        ) : foundRecords.length === 0 ? (
                          <div className="dash-empty">No order or quotation found for “{orderSearch.trim()}”.</div>
                        ) : (
                          foundRecords.map((q) => (
                            <div className="lk-result" key={q.id}>
                              <div className="lk-result-head">
                                <div>
                                  <b className="mono">{q.id}</b> · {q.type === "order" ? "Order" : "Quotation"}
                                  <div className="lk-note">{q.date} · {q.customer} · Ordered by {q.orderedBy}{q.dept ? " (" + q.dept + ")" : ""}{q.contact ? " · " + q.contact : ""}</div>
                                </div>
                                <button className="dash-view-btn" onClick={() => viewHistoryQuote(q)}>Open full view</button>
                              </div>
                              <table className="admin-table">
                                <thead><tr><th>SW Item Code</th><th>Customer Item Code</th><th>Product</th><th className="num">Rate</th><th className="num">Qty</th><th className="num">Amount</th></tr></thead>
                                <tbody>
                                  {q.items.map((it) => {
                                    const prod = products.find((pp) => pp.id === it.id);
                                    return (
                                      <tr key={it.id}>
                                        <td className="mono">{it.swCode || prod?.swCode || "—"}</td>
                                        <td className="mono">{it.customerCode || prod?.customerCode || "—"}</td>
                                        <td>{it.name}</td>
                                        <td className="mono num">₹{it.price}{Number(it.discountPct) > 0 && <div className="lk-note" style={{ marginTop: 0 }}>−{it.discountPct}% disc.</div>}</td>
                                        <td className="mono num">{it.qty}</td>
                                        <td className="mono num">{inr(lineAmt(it))}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                              <div className="lk-totals">
                                <span>Subtotal: <b className="mono">{inr(q.subtotal)}</b></span>
                                <span>GST (18%): <b className="mono">{inr(q.gst)}</b></span>
                                <span>Grand Total: <b className="mono">{inr(q.grand)}</b></span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <div className="dash-card">
                    <div className="dash-card-head">
                      <div className="dash-tab-group">
                        <button className={"dash-tab-btn" + (dashListTab === "quotations" ? " active" : "")} onClick={() => setDashListTab("quotations")}>{dashListTab === "quotations" ? "Recent Quotations" : "Quotations"}</button>
                        <button className={"dash-tab-btn" + (dashListTab === "orders" ? " active" : "")} onClick={() => setDashListTab("orders")}>{dashListTab === "orders" ? "Recent Orders" : "Orders"}</button>
                      </div>
                      <button className="dash-link-btn" onClick={() => { setActiveNav(""); setViewedQuote(null); setView("newquote"); window.scrollTo(0, 0); }}>+ New Quotation</button>
                      <button className="dash-link-btn" onClick={() => { setActiveNav(""); setViewedQuote(null); setView("neworder"); window.scrollTo(0, 0); }}>+ New Order</button>
                    </div>
                    {historyLoading ? (
                      <div className="dash-empty">Loading your history…</div>
                    ) : dashListItems.length === 0 ? (
                      <div className="dash-empty">{dashListTab === "orders" ? "No orders yet — open one of your quotations and press Place Order." : "No quotations yet — browse the catalog and generate your first one."}</div>
                    ) : (
                      <table className="admin-table dash-quote-table">
                        <thead><tr><th>{dashListTab === "orders" ? "Order No." : "Quote No."}</th><th>Date</th><th>Items</th><th>Total</th><th></th></tr></thead>
                        <tbody>
                          {dashListItems.slice(0, 6).map((q) => (
                            <tr key={q.id}>
                              <td className="mono">{q.id}{q.type !== "order" && (q.orderId || quoteHistory.some((x) => x.fromQuotation === q.id)) && <span className="eq-tag eq-tag-green">order done</span>}</td>
                              <td>{q.date}</td>
                              <td>{q.items.reduce((a, it) => a + it.qty, 0)} pcs</td>
                              <td className="mono">{inr(q.grand)}</td>
                              <td><button className="dash-view-btn" onClick={() => viewHistoryQuote(q)}>View</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  <div className="dash-card">
                    <div className="dash-card-head"><h3>Frequently Ordered</h3></div>
                    {topProducts.length === 0 ? (
                      <div className="dash-empty">Your most-ordered products will show up here once you generate a quotation.</div>
                    ) : (
                      <div className="dash-freq-grid">
                        {topProducts.map(({ product, qty }) => {
                          const dfiQty = qtyMap[product.id] || 1;
                          const dfiInCart = cart[product.id] || 0;
                          return (
                          <div className="dash-freq-item" key={product.id}>
                            <div className="dfi-tile">{product.image ? <img src={product.image} alt="" /> : product.initial}</div>
                            <div className="dfi-body">
                              <div className="dfi-name">{product.name}</div>
                              <div className="dfi-meta">Ordered {qty} times total · ₹{product.price}</div>
                            </div>
                            <div className="qty-ctrl dfi-qty-ctrl">
                              <button onClick={() => stepQty(product.id, -1)}>−</button>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={dfiQty}
                                onChange={(e) => setQtyDirect(product.id, e.target.value)}
                                onFocus={selectAllOnFocus}
                        onClick={selectAllOnFocus}
                              />
                              <button onClick={() => stepQty(product.id, 1)}>+</button>
                            </div>
                            <button className={"add-btn" + (dfiInCart ? " added" : "")} onClick={() => addToCart(product.id)}>
                              {dfiInCart ? `Added (${dfiInCart})` : "Add"}
                            </button>
                          </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>

                <div className="dash-col-side">
                  <div className="dash-card">
                    <div className="dash-card-head"><h3>Account</h3></div>
                    <ul className="dash-account-list">
                      <li><span>Login ID</span><b className="mono">{user.id}</b></li>
                      <li><span>Organization</span><b>{user.org}</b></li>
                      <li><span>Department</span><b>{user.dept}</b></li>
                    </ul>
                  </div>

                  {monthlyExpense.length > 0 && (
                    <div className="dash-card">
                      <div className="dash-card-head"><h3>Monthly Expense</h3></div>
                      <div className="dash-cat-bars">
                        {monthlyExpense.map((m) => (
                          <div className="dcb-row" key={m.key}>
                            <div className="dcb-label"><span>{m.label}</span><span className="mono">{inr(m.total)}</span></div>
                            <div className="dcb-track"><div className="dcb-fill" style={{ width: m.pct + "%" }} /></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {mrpVsSwPrice.rows.length > 0 && (
                    <div className="dash-card">
                      <div className="dash-card-head"><h3>MRP vs SW Price</h3></div>
                      <ul className="dash-account-list">
                        <li><span>Total at MRP</span><b className="mono">{inr(mrpVsSwPrice.totals.mrpTotal)}</b></li>
                        <li><span>Total at SW Price</span><b className="mono">{inr(mrpVsSwPrice.totals.swTotal)}</b></li>
                        <li><span>You Saved</span><b className="mono">{inr(mrpVsSwPrice.totals.mrpTotal - mrpVsSwPrice.totals.swTotal)}</b></li>
                      </ul>
                      <div className="dash-quote-table-wrap">
                        <table className="admin-table dash-quote-table mini">
                          <thead><tr><th>Product</th><th className="num">MRP</th><th className="num">SW</th><th className="num">Saved</th></tr></thead>
                          <tbody>
                            {mrpVsSwPrice.rows.map((r) => (
                              <tr key={r.name}>
                                <td>{r.name}</td>
                                <td className="num mono">{inr(r.mrpTotal)}</td>
                                <td className="num mono">{inr(r.swTotal)}</td>
                                <td className="num mono">{r.savePct}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {view === "catalog" && (
            <div className="main-wrap">
              <div className="catalog-layout">
                <aside className="filter-sidebar">
                  <h3>Filter by</h3>
                  <hr className="filter-divider" />
                  <div className="filter-group-title">Categories</div>
                  <ul className="filter-list">
                    <li><button className={activeCat === "all" ? "active" : ""} onClick={() => setActiveCat("all")}>All</button></li>
                    {CATEGORIES.map((c) => (
                      <li key={c.id}>
                        <button className={activeCat === c.id ? "active" : ""} onClick={() => setActiveCat(c.id)}>{c.name}</button>
                      </li>
                    ))}
                  </ul>

                  <div className="price-filter-head" onClick={() => setPriceOpen((o) => !o)}>
                    <span className="pf-label">Price</span>
                    <span className="pf-toggle">{priceOpen ? "–" : "+"}</span>
                  </div>
                  {priceOpen && (
                    <div className="price-filter">
                      <div className="price-filter-track">
                        <div
                          className="price-filter-range"
                          style={{
                            left: `${((priceRange[0] - priceBounds[0]) / Math.max(1, priceBounds[1] - priceBounds[0])) * 100}%`,
                            right: `${100 - ((priceRange[1] - priceBounds[0]) / Math.max(1, priceBounds[1] - priceBounds[0])) * 100}%`,
                          }}
                        />
                        <input
                          type="range"
                          min={priceBounds[0]}
                          max={priceBounds[1]}
                          value={priceRange[0]}
                          style={{ zIndex: priceRange[0] > priceBounds[1] - 100 ? 5 : 3 }}
                          onChange={(e) => {
                            const v = Math.min(Number(e.target.value), priceRange[1] - 1);
                            setPriceRange([v, priceRange[1]]);
                          }}
                        />
                        <input
                          type="range"
                          min={priceBounds[0]}
                          max={priceBounds[1]}
                          value={priceRange[1]}
                          style={{ zIndex: 4 }}
                          onChange={(e) => {
                            const v = Math.max(Number(e.target.value), priceRange[0] + 1);
                            setPriceRange([priceRange[0], v]);
                          }}
                        />
                      </div>
                      <div className="price-filter-labels">
                        <span>₹{priceRange[0]}</span>
                        <span>₹{priceRange[1]}</span>
                      </div>
                    </div>
                  )}
                </aside>

                <div className="catalog-content">
                  <div className={"page-head" + (headIn ? " in" : "")}>
                    <div>
                      <h1>Product Catalog</h1>
                      <p>Showing {filteredProducts.length} of {products.length}+ sample products (full catalog: 1,000+ items)</p>
                    </div>
                    <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
                      <option value="default">Sort: Featured</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                      <option value="name-asc">Name: A–Z</option>
                    </select>
                  </div>

                  {productsLoading ? (
                    <div className="empty-state"><h3>Loading catalog…</h3><p>Fetching products, one moment.</p></div>
                  ) : productsError ? (
                    <div className="empty-state"><h3>Couldn't load the catalog</h3><p>{productsError}</p></div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="empty-state"><h3>No products found</h3><p>Try a different search term or category.</p></div>
                  ) : (
                    <div className="product-grid">
                      {filteredProducts.map((p, i) => {
                        const qty = qtyMap[p.id] || 1;
                        const inCart = cart[p.id] || 0;
                        return (
                          <div className="pcard" key={p.id} style={{ animationDelay: Math.min(i, 16) * 0.035 + "s" }}>
                            <div className="ptile">
                              {p.image ? <img src={p.image} alt={p.catName} loading="lazy" /> : <span>{p.initial}</span>}
                            </div>
                            <div className="pbody">
                              <div className="pcat">{p.catName}</div>
                              <div className="pname">{p.name}</div>
                              <div className="punit">{p.unit}</div>
                              <div className="pprice">₹{p.price} <small>/ {p.unit.replace("per ", "")}</small></div>
                              <div className="qty-row">
                                <div className="qty-ctrl">
                                  <button onClick={() => stepQty(p.id, -1)}>−</button>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={qty}
                                    onChange={(e) => setQtyDirect(p.id, e.target.value)}
                                    onFocus={selectAllOnFocus}
                        onClick={selectAllOnFocus}
                                  />
                                  <button onClick={() => stepQty(p.id, 1)}>+</button>
                                </div>
                                <button className={"add-btn" + (inCart ? " added" : "")} onClick={() => addToCart(p.id)}>
                                  {inCart ? `Added (${inCart})` : "Add to Items"}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {["myorders", "myinvoices", "mydispatch", "profile"].includes(view) && user && user.id !== "ADMIN" && (
            <CustomerPages
              page={{ myorders: "orders", myinvoices: "invoices", mydispatch: "dispatch", profile: "profile" }[view]}
              user={user}
              search={search}
              setSearch={setSearch}
              setToast={setToast}
              onViewQuote={viewHistoryQuote}
              onNewQuotation={() => { setActiveNav(""); setViewedQuote(null); setView("newquote"); window.scrollTo(0, 0); }}
              onNewOrder={() => { setActiveNav(""); setViewedQuote(null); setView("neworder"); window.scrollTo(0, 0); }}
              onProfileSaved={(u) => { setUser(u); setQContact(u.phone || ""); }}
            />
          )}

          {view === "newquote" && user && user.id !== "ADMIN" && (
            <NewQuotation
              user={user}
              setToast={setToast}
              onBrowseCatalog={() => { setCheckoutIntent("quotation"); setActiveNav("Shop"); setView("catalog"); setActiveCat("all"); window.scrollTo(0, 0); }}
              onCreated={(record) => { setQuoteHistory((prev) => [record, ...prev]); setDashListTab("quotations"); viewHistoryQuote(record); setToast("Quotation generated ✓"); }}
            />
          )}

          {view === "neworder" && user && user.id !== "ADMIN" && (
            <NewQuotation
              kind="order"
              user={user}
              setToast={setToast}
              onBrowseCatalog={() => { setCheckoutIntent("order"); setActiveNav("Shop"); setView("catalog"); setActiveCat("all"); window.scrollTo(0, 0); }}
              onCreated={(record) => { setQuoteHistory((prev) => [record, ...prev]); setDashListTab("orders"); viewHistoryQuote(record); }}
            />
          )}

          {view === "admin" && (
            <div className="main-wrap">
              <div className="page-header" style={{ padding: 0, marginBottom: 22 }}>
                <h1>{adminTab === "dashboard" ? "Dashboard" : adminTab === "pending" ? "Pending Dispatch" : adminTab === "invoices" ? "Invoices" : adminTab === "dispatch" ? "Dispatch" : adminTab === "quotes" ? (aqFilter === "order" ? "Orders" : aqFilter === "quotation" ? "Quotations" : "Quotations & Orders") : adminTab === "customers" ? "Customer Management" : "Product Items"}</h1>
                <p>{adminTab === "dashboard" ? "A quick look at your whole business — click a card to open it." : adminTab === "pending" ? "Orders that still have pieces waiting to be dispatched." : adminTab === "invoices" ? "Every invoice made from Dispatch — search, open and print them here." : adminTab === "dispatch" ? "Select an order, dispatch items (full or partial), then make the invoice with GST." : adminTab === "quotes" ? "Every quotation and order your customers generate shows up here — open one to edit it." : adminTab === "customers" ? "View everyone registered on the customer portal." : "Search, add, edit or remove products in the catalog."}</p>
              </div>

              {adminTab === "dashboard" ? (
                <AdminDashboard setToast={setToast} onGo={goAdminTab} />
              ) : adminTab === "pending" ? (
                <PendingPanel setToast={setToast} onGo={goAdminTab} />
              ) : adminTab === "invoices" ? (
                <InvoicesPanel setToast={setToast} />
              ) : adminTab === "dispatch" ? (
                <DispatchPanel setToast={setToast} />
              ) : adminTab === "quotes" ? (
                <>
                  <div className="admin-toolbar">
                    <div className="admin-search-wrap">
                      <div className="admin-search">
                        <IconSearchDark />
                        <input
                          type="text"
                          placeholder="Search by quote/order no., customer or user ID"
                          value={aqSearch}
                          onChange={(e) => setAqSearch(e.target.value)}
                        />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button type="button" className="btn-outline" disabled={adminQuoteRows.length === 0} onClick={() => exportListPdf(quotesExportSpec())}>⬇️ Export PDF</button>
                      <button type="button" className="btn-outline" disabled={adminQuoteRows.length === 0} onClick={() => exportListXlsx(quotesExportSpec())}>⬇️ Export Excel</button>
                    </div>
                  </div>

                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr><th>No.</th><th>Type</th><th>Customer</th><th>Ordered By</th><th>Date</th><th>Items</th><th className="num">Total</th><th>Actions</th></tr>
                      </thead>
                      <tbody>
                        {adminQuotesLoading ? (
                          <tr><td colSpan={8} className="admin-empty">Loading quotations…</td></tr>
                        ) : adminQuoteRows.length === 0 ? (
                          <tr><td colSpan={8} className="admin-empty">No quotations or orders found.</td></tr>
                        ) : (
                          adminQuoteRows.map((q) => (
                            <tr key={q.id}>
                              <td className="mono">{q.id}{q.editedByAdmin && <span className="eq-tag">edited</span>}{q.type !== "order" && (q.orderId || adminQuotes.some((x) => x.fromQuotation === q.id)) && <span className="eq-tag eq-tag-green">ordered</span>}{q.type === "order" && q.fromQuotation && <div className="lk-note" style={{ marginTop: 0 }}>from {q.fromQuotation}</div>}</td>
                              <td>{q.type === "order" ? "Order" : "Quotation"}</td>
                              <td>{q.customer}<div className="lk-note" style={{ marginTop: 0 }}>{q.customerId}</div></td>
                              <td>{q.orderedBy}</td>
                              <td>{q.date}</td>
                              <td>{q.items.reduce((a, it) => a + Number(it.qty), 0)} pcs</td>
                              <td className="mono num">{inr(q.grand)}</td>
                              <td>
                                <div className="admin-actions">
                                  <button aria-label="Edit" title="Edit" onClick={() => openEditQuote(q)}>✏️</button>
                                  <button aria-label="View PDF" title="View PDF" onClick={() => viewPdf(q, q.type === "order" ? "ORDER" : "QUOTATION")}>👁️</button>
                                  <button aria-label="Download PDF" title="Download PDF" onClick={() => downloadPdf(q, q.type === "order" ? "ORDER" : "QUOTATION")}>⬇️</button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {editingQuote && (() => {
                    const eqGross = editingQuote.items.reduce((s, it) => s + Number(it.price || 0) * Number(it.qty || 0), 0);
                    const eqSub = Math.round(editingQuote.items.reduce((s, it) => s + lineAmt(it), 0) * 100) / 100;
                    const eqDiscount = Math.round((eqGross - eqSub) * 100) / 100;
                    const eqGst = Math.round(eqSub * 0.18);
                    const eqOrderMade = editingQuote.type === "order" ? null : (editingQuote.orderId || adminQuotes.find((x) => x.fromQuotation === editingQuote.id)?.id || null);
                    return (
                      <div className="admin-modal-overlay" onClick={closeEditQuote}>
                        <div className="admin-modal eq-modal" onClick={(e) => e.stopPropagation()}>
                          <div className="admin-modal-head">
                            <h3>Edit {editingQuote.type === "order" ? "Order" : "Quotation"} · <span className="mono">{editingQuote.id}</span></h3>
                            <button aria-label="Close" onClick={closeEditQuote}><IconClose2 /></button>
                          </div>

                          <div className="eq-grid">
                            <div className="field"><label>Customer / Organization</label><input type="text" value={editingQuote.customer || ""} onChange={(e) => eqSetField("customer", e.target.value)} /></div>
                            <div className="field"><label>Ordered By</label><input type="text" value={editingQuote.orderedBy || ""} onChange={(e) => eqSetField("orderedBy", e.target.value)} /></div>
                            <div className="field"><label>Department</label><input type="text" value={editingQuote.dept || ""} onChange={(e) => eqSetField("dept", e.target.value)} /></div>
                            <div className="field"><label>Contact</label><input type="text" value={editingQuote.contact || ""} onChange={(e) => eqSetField("contact", e.target.value)} /></div>
                            <div className="field"><label>Date</label><input type="date" value={editingQuote.date || ""} onChange={(e) => eqSetField("date", e.target.value)} /></div>
                          </div>

                          <div className="eq-scroll">
                            <table className="admin-table">
                              <thead><tr><th>SW Item Code</th><th>Customer Item Code</th><th>Product</th><th>Rate (₹)</th><th>Qty</th><th>Discount %</th><th className="num">Amount</th><th></th></tr></thead>
                              <tbody>
                                {editingQuote.items.map((it, idx) => (
                                  <tr key={it.id}>
                                    <td className="mono">{it.swCode || "—"}</td>
                                    <td className="mono">{it.customerCode || "—"}</td>
                                    <td>{it.name}</td>
                                    <td><input className="eq-num" type="number" min="0" step="0.01" value={it.price} onChange={(e) => eqSetItem(idx, "price", e.target.value === "" ? "" : Number(e.target.value))} /></td>
                                    <td><input className="eq-num" type="number" min="1" step="1" value={it.qty} onChange={(e) => eqSetItem(idx, "qty", e.target.value === "" ? "" : Number(e.target.value))} /></td>
                                    <td><input className="eq-num" type="number" min="0" max="100" step="0.01" placeholder="0" value={it.discountPct ?? ""} onChange={(e) => eqSetItem(idx, "discountPct", e.target.value === "" ? "" : Number(e.target.value))} /></td>
                                    <td className="mono num">{inr(lineAmt(it))}</td>
                                    <td><div className="admin-actions"><button aria-label="Remove item" title="Remove item" onClick={() => eqRemoveItem(idx)}>🗑️</button></div></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <div className="eq-add">
                            <select value={eqAddId} onChange={(e) => setEqAddId(e.target.value)}>
                              <option value="">+ Add another product…</option>
                              {adminProducts.map((p) => (
                                <option key={p.id} value={p.id}>{(p.swCode || "") + " · " + p.name}</option>
                              ))}
                            </select>
                            <button type="button" className="dash-view-btn" disabled={!eqAddId} onClick={eqAddItem}>Add</button>
                          </div>

                          <div className="lk-totals">
                            {eqDiscount > 0 && <span>Total Discount: <b className="mono" style={{ color: "#1c7a3e" }}>−{inr(eqDiscount)}</b></span>}
                            <span>Subtotal{eqDiscount > 0 ? " (after discount)" : ""}: <b className="mono">{inr(eqSub)}</b></span>
                            <span>GST (18%): <b className="mono">{inr(eqGst)}</b></span>
                            <span>Grand Total: <b className="mono">{inr(eqSub + eqGst)}</b></span>
                          </div>

                          {editingQuote.type !== "order" && eqOrderMade && (
                            <div className="eq-ordered-note">✓ Order <b className="mono">{eqOrderMade}</b> has already been made from this quotation.</div>
                          )}
                          <div className="eq-actions">
                            <button type="button" className="dash-view-btn" onClick={closeEditQuote}>Cancel</button>
                            <button type="button" className="admin-add-btn" disabled={eqSaving} onClick={() => saveEditedQuote(false)}>{eqSaving ? "Saving…" : "Save Changes"}</button>
                            {editingQuote.type !== "order" && !eqOrderMade && (
                              <button type="button" className="eq-make-order" disabled={eqSaving} onClick={() => saveEditedQuote(true)}>Save &amp; Make Order</button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </>
              ) : adminTab === "customers" ? (
                <>
                  <div className="admin-toolbar">
                    <div className="admin-search-wrap">
                      <div className="admin-search">
                        <IconSearchDark />
                        <input
                          type="text"
                          placeholder="Search by name, organization or User ID"
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                        />
                        {customerSearch && (
                          <button type="button" className="admin-search-clear" aria-label="Clear search" onClick={() => setCustomerSearch("")}>
                            <IconClose2 />
                          </button>
                        )}
                      </div>
                    </div>
                    <button className="admin-add-btn" onClick={openAddCustomerModal}>+ Add Customer</button>
                  </div>

                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>User ID</th>
                          <th>Name</th>
                          <th>Organization</th>
                          <th>Department</th>
                          <th>Phone</th>
                          <th>Password</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customersLoading ? (
                          <tr><td colSpan={7} className="admin-empty">Loading customers…</td></tr>
                        ) : customersFiltered.length === 0 ? (
                          <tr><td colSpan={7} className="admin-empty">No customers found.</td></tr>
                        ) : (
                          customersFiltered.map((c) => (
                            <tr key={c.id}>
                              <td className="mono">{c.id}</td>
                              <td>{c.name}</td>
                              <td>{c.org}</td>
                              <td>{c.dept}</td>
                              <td className="mono">{c.phone}</td>
                              <td>
                                <div className="admin-pw-cell">
                                  <span className="mono">
                                    {revealedPwIds.has(c.id) ? c.password : "•".repeat(Math.max(6, (c.password || "").length))}
                                  </span>
                                  <button
                                    type="button"
                                    className="admin-pw-toggle"
                                    aria-label={revealedPwIds.has(c.id) ? "Hide password" : "Show password"}
                                    onClick={() => togglePasswordVisible(c.id)}
                                  >
                                    <IconEye />
                                  </button>
                                </div>
                              </td>
                              <td>
                                <div className="admin-actions">
                                  <button aria-label="Edit" onClick={() => openEditCustomerModal(c)}>✏️</button>
                                  <button aria-label="Delete" onClick={() => deleteCustomer(c)}>🗑️</button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {customerModalOpen && (
                    <div className="admin-modal-overlay" onClick={closeCustomerModal}>
                      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-head">
                          <h3>{editingCustomerId != null ? "Edit Customer" : "Add Customer"}</h3>
                          <button aria-label="Close" onClick={closeCustomerModal}><IconClose2 /></button>
                        </div>
                        <form onSubmit={saveCustomer}>
                          <div className="field">
                            <label htmlFor="cName">Full Name</label>
                            <input
                              type="text"
                              id="cName"
                              placeholder="e.g. Rajesh Kulkarni"
                              value={cName}
                              onChange={(e) => {
                                const v = e.target.value;
                                setCName(v);
                                if (editingCustomerId == null && cIdAuto) setCId(generateCustomerId(cOrg, v));
                              }}
                              required
                            />
                          </div>
                          <div className="field">
                            <label htmlFor="cOrg">Organization Name</label>
                            <input
                              type="text"
                              id="cOrg"
                              placeholder="e.g. RJ Enterprises Pvt. Ltd."
                              value={cOrg}
                              onChange={(e) => {
                                const v = e.target.value;
                                setCOrg(v);
                                if (editingCustomerId == null && cIdAuto) setCId(generateCustomerId(v, cName));
                              }}
                              required
                            />
                          </div>
                          <div className="field-row">
                            <div className="field">
                              <label htmlFor="cDept">Department</label>
                              <input type="text" id="cDept" placeholder="e.g. Administration" value={cDept} onChange={(e) => setCDept(e.target.value)} required />
                            </div>
                            <div className="field">
                              <label htmlFor="cPhone">Phone</label>
                              <input type="tel" id="cPhone" placeholder="e.g. 9822011234" value={cPhone} onChange={(e) => setCPhone(e.target.value)} required />
                            </div>
                          </div>
                          <div className="field">
                            <label htmlFor="cId">User ID {editingCustomerId == null && <span className="field-hint">(auto-filled — edit if you'd like a different one)</span>}</label>
                            <input
                              type="text"
                              id="cId"
                              placeholder="e.g. RJENT01"
                              value={cId}
                              onChange={(e) => { setCId(e.target.value); setCIdAuto(false); }}
                              required
                              disabled={editingCustomerId != null}
                            />
                          </div>
                          <div className="field-row">
                            <div className="field">
                              <label htmlFor="cPass">{editingCustomerId != null ? "New Password (optional)" : "Password"}</label>
                              <input type="password" id="cPass" placeholder="••••••••" value={cPass} onChange={(e) => setCPass(e.target.value)} required={editingCustomerId == null} />
                            </div>
                            <div className="field">
                              <label htmlFor="cConfirmPass">Confirm Password</label>
                              <input type="password" id="cConfirmPass" placeholder="••••••••" value={cConfirmPass} onChange={(e) => setCConfirmPass(e.target.value)} required={editingCustomerId == null} />
                            </div>
                          </div>
                          {cError && (
                            <div className="error-msg"><IconWarn /> {cErrorMsg || "Could not save customer."}</div>
                          )}
                          <div className="admin-modal-actions">
                            <button type="button" className="btn-outline" onClick={closeCustomerModal}>Cancel</button>
                            <button type="submit" className="btn-solid" disabled={customerSaving}>
                              {customerSaving ? "Saving…" : (editingCustomerId != null ? "Save Changes" : "Add Customer")}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </>
              ) : (
              <>
              <div className="admin-toolbar">
                <div className="admin-search-wrap" ref={adminSearchRef}>
                  <div className="admin-search">
                    <IconSearchDark />
                    <input
                      type="text"
                      placeholder="Search Product"
                      value={adminSearch}
                      onChange={(e) => handleAdminSearchChange(e.target.value)}
                      onFocus={() => setAdminDropdownOpen(true)}
                    />
                    {adminSearch && (
                      <button
                        type="button"
                        className="admin-search-clear"
                        aria-label="Clear search"
                        onClick={() => { setAdminSearch(""); setAdminDropdownOpen(false); setAdminPage(1); }}
                      >
                        <IconClose2 />
                      </button>
                    )}
                    <button
                      type="button"
                      className="admin-search-go"
                      aria-label="Search"
                      onClick={() => setAdminDropdownOpen(false)}
                    >
                      <IconSearch />
                    </button>
                  </div>

                  {adminDropdownOpen && adminSearch.trim() && (
                    <div className="admin-search-dropdown">
                      <div className="asd-label">Products</div>
                      {adminSuggestions.length === 0 ? (
                        <div className="asd-empty">No matching products</div>
                      ) : (
                        adminSuggestions.map((p) => (
                          <button key={p.id} className="asd-item" onClick={() => pickAdminSuggestion(p)}>
                            <span className="asd-thumb">
                              {p.image ? <img src={p.image} alt="" /> : (p.initial || p.name.charAt(0))}
                            </span>
                            <span className="asd-body">
                              <span className="asd-name">{p.name}</span>
                              <span className="asd-meta">• {p.category} • ₹{p.price} • Qty {p.qty}</span>
                            </span>
                          </button>
                        ))
                      )}
                      <button className="asd-footer" onClick={() => setAdminDropdownOpen(false)}>
                        <IconSearch /> Search all "{adminSearch}"
                      </button>
                    </div>
                  )}
                </div>

                <button className="admin-add-btn" onClick={openAddModal}>+ Add Product</button>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>ID</th>
                      <th>SW Item Code</th>
                      <th>Customer Item Code</th>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Qty</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminLoading ? (
                      <tr><td colSpan={9} className="admin-empty">Loading products…</td></tr>
                    ) : adminPageItems.length === 0 ? (
                      <tr><td colSpan={9} className="admin-empty">No products found.</td></tr>
                    ) : (
                      adminPageItems.map((p) => (
                        <tr key={p.id}>
                          <td>
                            <span className="admin-table-thumb">
                              {p.image ? <img src={p.image} alt="" /> : (p.initial || p.name.charAt(0))}
                            </span>
                          </td>
                          <td className="mono">{p.id}</td>
                          <td className="mono">{p.swCode || "—"}</td>
                          <td className="mono">{p.customerCode || "—"}</td>
                          <td>{p.name}</td>
                          <td>{p.category}</td>
                          <td className="mono">₹{p.price}</td>
                          <td className="mono">{p.qty}</td>
                          <td>
                            <div className="admin-actions">
                              <button aria-label="Edit" onClick={() => openEditModal(p)}>✏️</button>
                              <button aria-label="Delete" onClick={() => deleteProduct(p)}>🗑️</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="admin-pagination">
                <button disabled={adminPageClamped <= 1} onClick={() => setAdminPage((p) => Math.max(1, p - 1))}>◀ Previous</button>
                <div className="admin-page-numbers">
                  {Array.from({ length: adminTotalPages }, (_, i) => i + 1).map((n) => (
                    <button key={n} className={n === adminPageClamped ? "active" : ""} onClick={() => setAdminPage(n)}>{n}</button>
                  ))}
                </div>
                <button disabled={adminPageClamped >= adminTotalPages} onClick={() => setAdminPage((p) => Math.min(adminTotalPages, p + 1))}>Next ▶</button>
              </div>

              {productModalOpen && (
                <div className="admin-modal-overlay" onClick={closeProductModal}>
                  <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="admin-modal-head">
                      <h3>{editingProductId != null ? "Edit Product" : "Add Product"}</h3>
                      <button aria-label="Close" onClick={closeProductModal}><IconClose2 /></button>
                    </div>
                    <form onSubmit={saveProduct}>
                      <div className="field">
                        <label>Product Name</label>
                        <input type="text" value={pmName} onChange={(e) => setPmName(e.target.value)} required />
                      </div>
                      <div className="field">
                        <label>Customer Item Code <span className="field-hint">(optional — SW Item Code is auto-generated)</span></label>
                        <input type="text" value={pmCustomerCode} onChange={(e) => setPmCustomerCode(e.target.value)} placeholder="e.g. CU-001" />
                      </div>
                      <div className="field">
                        <label>Product Image <span className="field-hint">(optional)</span></label>
                        <div className="pm-image-field">
                          <div className="pm-image-preview">
                            {pmImage ? <img src={pmImage} alt="" /> : <span>{pmName ? pmName.charAt(0).toUpperCase() : "?"}</span>}
                          </div>
                          <div className="pm-image-actions">
                            <label className="btn-outline pm-image-upload">
                              {pmImage ? "Change Image" : "Choose Image"}
                              <input type="file" accept="image/*" onChange={handleProductImageFile} hidden />
                            </label>
                            {pmImage && (
                              <button type="button" className="pm-image-remove" onClick={() => setPmImage("")}>Remove</button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="field">
                        <label>Category</label>
                        <select value={pmCategory} onChange={(e) => setPmCategory(e.target.value)}>
                          {CATEGORIES.map((c) => (<option key={c.id} value={c.name}>{c.name}</option>))}
                        </select>
                      </div>
                      <div className="field-row">
                        <div className="field">
                          <label>Price (₹)</label>
                          <input type="number" min="0" value={pmPrice} onChange={(e) => setPmPrice(e.target.value)} required />
                        </div>
                        <div className="field">
                          <label>Quantity</label>
                          <input type="number" min="0" value={pmQty} onChange={(e) => setPmQty(e.target.value)} required />
                        </div>
                      </div>
                      <div className="admin-modal-actions">
                        <button type="button" className="btn-outline" onClick={closeProductModal}>Cancel</button>
                        <button type="submit" className="btn-solid" disabled={adminSaving}>{adminSaving ? "Saving…" : (editingProductId != null ? "Save Changes" : "Add Product")}</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
              </>
              )}
            </div>
          )}

          {view === "about" && (
            <>
              <div className="page-header">
                <h1>About Stationery World</h1>
                <p>Get to know the team behind your everyday office and school supplies.</p>
              </div>
              <div className="info-section">
                <div className="info-card">
                  <h2>Who we are</h2>
                  <p>Stationery World supplies writing, office, art and school essentials to organizations that need one reliable source for everyday supplies.</p>
                  <p>This customer ordering portal lets your registered team browse the full catalog, build a selection, and generate a shareable quotation in minutes — no back-and-forth emails needed.</p>
                  <div className="stat-row">
                    <div className="stat-box"><b>{CATEGORIES.length}</b><span>Categories</span></div>
                    <div className="stat-box"><b>{products.length}+</b><span>Sample Products</span></div>
                    <div className="stat-box"><b>1000+</b><span>Full Catalog Items</span></div>
                    <div className="stat-box"><b>24h</b><span>Quote Turnaround</span></div>
                  </div>
                </div>
              </div>
            </>
          )}

          {view === "whyus" && (
            <>
              <div className="page-header">
                <h1>Why Choose Us</h1>
                <p>A few reasons registered customers keep coming back to this portal.</p>
              </div>
              <div className="info-section">
                <div className="feature-grid">
                  {WHY_US.map((f) => (
                    <div className="feature-card" key={f.title}>
                      <div className="fc-icon"><IconCheck /></div>
                      <h3>{f.title}</h3>
                      <p>{f.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {view === "services" && (
            <>
              <div className="page-header">
                <h1>Our Services</h1>
                <p>Beyond the catalog, here's how we support your ordering process.</p>
              </div>
              <div className="info-section">
                <div className="service-grid">
                  {SERVICES.map((s) => (
                    <div className="service-card" key={s.title}>
                      <div className="fc-icon"><IconCheck /></div>
                      <h3>{s.title}</h3>
                      <p>{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <footer className="site-footer">
            <div className="footer-main">
              <div className="footer-brand">
                <div className="fb-logo">
                  <img src={LOGO} alt="Stationery World" />
                  <span>Stationery World</span>
                </div>
                <p>Your one-stop customer ordering portal for writing, office, art, computer and school essentials — 1,000+ products, one simple catalog.</p>
                <div className="footer-social">
                  <a href="#" aria-label="Facebook" onClick={(e) => e.preventDefault()}><IconFacebook /></a>
                  <a href="#" aria-label="Instagram" onClick={(e) => e.preventDefault()}><IconInstagram /></a>
                  <a href="#" aria-label="LinkedIn" onClick={(e) => e.preventDefault()}><IconLinkedin /></a>
                </div>
              </div>

              <div className="footer-col">
                <h4>Quick Links</h4>
                <ul>
                  {(user?.id === "ADMIN" ? NAV_LINKS : CUSTOMER_NAV).map((link) => (
                    <li key={link.label}>
                      <button onClick={() => {
                        setActiveNav(link.label);
                        setView(link.view);
                        if (link.cat) setActiveCat(link.cat);
                        else if (link.view === "catalog") setActiveCat("all");
                        window.scrollTo(0, 0);
                      }}>{link.label}</button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="footer-col">
                <h4>Categories</h4>
                <ul>
                  {CATEGORIES.slice(0, 5).map((c) => (
                    <li key={c.id}>
                      <button onClick={() => { setActiveNav("Shop"); setView("catalog"); setActiveCat(c.id); window.scrollTo(0, 0); }}>{c.name}</button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="footer-col">
                <h4>Get in Touch</h4>
                <ul className="footer-contact">
                  <li><IconPin /> <span>G-20 NICE Sankul,ITI Singnal,MIDC Area,Satpur,Nashik</span></li>
                  <li><IconPhone /> <span>+91 9370534398</span></li>
                  <li><IconMail /> <span>saumitra@officestationeryworld.com</span></li>
                </ul>
              </div>
            </div>
            <div className="footer-bottom">
              <div className="footer-bottom-inner">
                <span>© {new Date().getFullYear()} Stationery World. All rights reserved.</span>
                <div className="footer-bottom-links">
                  <a href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a>
                  <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
                  <a href="#" onClick={(e) => e.preventDefault()}>Support</a>
                </div>
              </div>
            </div>
          </footer>

          <div className={"overlay" + (drawerOpen ? " show" : "")} onClick={() => setDrawerOpen(false)} />
          <div className={"drawer" + (drawerOpen ? " show" : "")}>
            <div className="drawer-head">
              <h3>Your Selection</h3>
              <button onClick={() => setDrawerOpen(false)} aria-label="Close"><IconClose /></button>
            </div>
            <div className="drawer-body">
              {cartIds.length === 0 ? (
                <div className="drawer-empty"><p>Your quotation selection is empty.<br />Browse the catalog and add products.</p></div>
              ) : (
                cartIds.map((id) => {
                  const p = products.find((pp) => pp.id === parseInt(id));
                  return (
                    <div className="cart-item" key={id}>
                      <div className="ci-tile">
                        {p.image ? <img src={p.image} alt={p.catName} /> : p.initial}
                      </div>
                      <div className="ci-info">
                        <div className="ci-name">{p.name}</div>
                        <div className="ci-meta">Qty {cart[id]} × ₹{p.price} = <b className="mono">{inr(cart[id] * p.price)}</b></div>
                        <button className="ci-remove" onClick={() => removeFromCart(id)}>Remove</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="drawer-footer">
              <div className="df-row"><span>Items selected</span><span className="mono">{cartCount}</span></div>
              <div className="df-row total"><span>Estimated total</span><span className="mono">{inr(cartTotal)}</span></div>
              <div className="drawer-btn-row">
                <button className="gen-quote-btn" disabled={cartCount === 0 || submitLoading} onClick={generateQuotation}>{submitLoading ? "Submitting…" : "Generate Quotation"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {view === "quote" && user && (
        <div className="quote-wrap">
          <div className="quote-toolbar no-print">
            <button
              className="back-link"
              onClick={() => {
                if (viewedQuote) {
                  setViewedQuote(null);
                  setActiveNav("My Dashboard");
                  setView("dashboard");
                } else {
                  setView("catalog");
                }
              }}
            >
              <IconBack /> {viewedQuote ? "Back to dashboard" : "Back to catalog"}
            </button>
            <div className="quote-actions">
              <button className="btn-outline" onClick={() => window.print()}>Print / Save PDF</button>
              {!viewedQuote && <button className="btn-solid" onClick={startNewQuotation}>Start New Quotation</button>}
              {viewedQuote && viewedQuote.type !== "order" && user.id !== "ADMIN" && (
                placedOrderForViewed
                  ? <button className="btn-outline" onClick={() => { setViewedQuote(placedOrderForViewed); window.scrollTo(0, 0); }}>View Order {placedOrderForViewed.id}</button>
                  : <button className="btn-solid" disabled={submitLoading} onClick={placeOrderFromQuotation}>{submitLoading ? "Placing…" : "Place Order"}</button>
              )}
            </div>
          </div>

          <div className="quote-paper">
            <div className="quote-head">
              <div className="quote-brand">
                <img src={LOGO} alt="Stationery World" />
                <div><h2>Stationery World</h2><small>{qDocType === "order" ? "Order Confirmation" : "Customer Quotation"}</small></div>
              </div>
              <div className="quote-banner"><span>{qDocType === "order" ? "ORDER" : "QUOTATION"}</span></div>
            </div>
            <div className="quote-head-line"></div>

            <div className="quote-id-badge">
              <div className="qid-no">{qDocType === "order" ? "Order No." : "Quotation No."}<b>{qDisplayNo}</b></div>
              {viewedQuote && <span className="quote-history-badge">{qDocType === "order" ? "Past Order" : "Past Quotation"}</span>}
            </div>

            {viewedQuote && viewedQuote.type !== "order" && placedOrderForViewed && (
              <div className="quote-done-notice no-print">
                ✓ <b>Your order is done.</b> This quotation has been confirmed as Order <b className="mono">{placedOrderForViewed.id}</b>.
                <button className="btn-solid" onClick={() => { markOrderSeen(placedOrderForViewed.id); setViewedQuote(placedOrderForViewed); window.scrollTo(0, 0); }}>View Order</button>
              </div>
            )}
            {viewedQuote && viewedQuote.type === "order" && viewedQuote.fromQuotation && (
              <div className="quote-done-notice no-print">
                ✓ <b>Your order is done.</b> Created from quotation <b className="mono">{viewedQuote.fromQuotation}</b>.
              </div>
            )}

            <div className="quote-meta">
              <div className="qm-col">
                <div className="qm-field main"><label>Customer / Organization Name</label><input value={viewedQuote ? viewedQuote.customer : qCustomer} disabled={!!viewedQuote} onChange={(e) => setQCustomer(e.target.value)} /></div>
                <div className="qm-field"><label>Ordered By (User Name)</label><input value={viewedQuote ? viewedQuote.orderedBy : qOrderedBy} disabled={!!viewedQuote} onChange={(e) => setQOrderedBy(e.target.value)} /></div>
                <div className="qm-field"><label>Department Name</label><input value={viewedQuote ? viewedQuote.dept : qDept} disabled={!!viewedQuote} onChange={(e) => setQDept(e.target.value)} /></div>
              </div>
              <div className="qm-col">
                <div className="qm-field"><label>Date of Quotation</label><input type="date" value={viewedQuote ? viewedQuote.date : qDate} disabled={!!viewedQuote} onChange={(e) => setQDate(e.target.value)} /></div>
                <div className="qm-field"><label>Contact Number</label><input type="tel" placeholder="10-digit mobile number" value={qContactDisplay} disabled={!!viewedQuote} onChange={(e) => setQContact(e.target.value)} /></div>
              </div>
            </div>

            <div className="quote-table-wrap">
              <table className="quote-table">
                <thead><tr><th>#</th><th>SW Item Code</th><th>Customer Item Code</th><th>Product Details</th><th className="num">Unit Price</th><th className="num">Qty</th>{qHasDisc && <th className="num">Disc.</th>}<th className="num">Amount</th></tr></thead>
                <tbody>
                  {qItems.map((it, i) => (
                    <tr key={it.id}>
                      <td className="mono">{i + 1}</td>
                      <td className="mono">{it.swCode}</td>
                      <td className="mono">{it.customerCode || "—"}</td>
                      <td>
                        <div className="qt-item-cell">
                          <span className="qt-icon">{categoryEmoji(it.catName)}</span>
                          <div><div className="qt-name">{it.name}</div><div className="qt-cat">{it.catName}</div></div>
                        </div>
                      </td>
                      <td className="num mono">₹{it.price}</td>
                      <td className="num mono">{it.qty}</td>
                      {qHasDisc && <td className="num mono">{Number(it.discountPct) > 0 ? it.discountPct + "%" : "—"}</td>}
                      <td className="num mono">{inr(lineAmt(it))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  {qHasDisc && qDiscountTotal > 0 && <tr className="qt-tax"><td colSpan={qFootSpan}>Total Discount</td><td className="num mono">−{inr(qDiscountTotal)}</td></tr>}
                  <tr className="qt-subtotal"><td colSpan={qFootSpan}>Subtotal{qHasDisc ? " (after discount)" : ""}</td><td className="num mono">{inr(qSubtotal)}</td></tr>
                  <tr className="qt-tax"><td colSpan={qFootSpan}>GST (est. 18%)</td><td className="num mono">{inr(qGst)}</td></tr>
                  <tr className="qt-grand"><td colSpan={qFootSpan}>Grand Total</td><td className="num mono">{inr(qGrand)}</td></tr>
                </tfoot>
              </table>
            </div>

            <div className="quote-note">{qDocType === "order" ? "This order has been received by Stationery World. Our sales team will confirm final pricing, taxes and delivery timelines before dispatch." : "This is a system-generated indicative quotation from Stationery World. Final pricing, taxes and availability will be confirmed by our sales team before dispatch."}</div>

            <div className="quote-contact-row">
              <span><IconPhone /> +91 93226 86836</span>
              <span><IconMail /> info@stationeryworld.com</span>
            </div>

            <div className="quote-footer">
              <div className="quote-thankyou-bar"><span>Thank you for your business</span></div>
              <div className="signoff">
                <div className="sig-script">Stationery World</div>
                <div className="line"></div>
                <small>Authorized Signatory</small>
              </div>
            </div>
          </div>

          {viewedQuote && viewedQuote.type !== "order" && user.id !== "ADMIN" && (
            <div className="quote-place-row no-print">
              {placedOrderForViewed ? (
                <>
                  <span>✓ An order has already been placed for this quotation: <b className="mono">{placedOrderForViewed.id}</b></span>
                  <button className="btn-outline" onClick={() => { setViewedQuote(placedOrderForViewed); window.scrollTo(0, 0); }}>View Order</button>
                </>
              ) : (
                <>
                  <span>Happy with this quotation? Place an order for all the items above.</span>
                  <button className="btn-solid" disabled={submitLoading} onClick={placeOrderFromQuotation}>{submitLoading ? "Placing…" : "Place Order"}</button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      <div className={"toast" + (toast ? " show" : "")}>{toast}</div>
    </div>
  );
}
