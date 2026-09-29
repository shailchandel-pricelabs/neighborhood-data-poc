"""Prototype version switcher shown top-right, outside the phone mockup (desktop preview only)."""
def switcher(cur):
    opt = lambda v, label: '<option value="%s"%s>%s</option>' % (v, ' selected' if v == cur else '', label)
    return ('<!-- Prototype version switcher (desktop preview only, outside the phone) -->\n'
      '<style>.nd-ver-switch{position:fixed;top:16px;right:16px;z-index:99999;display:flex;align-items:center;gap:8px;'
      'font-family:"IBM Plex Sans",sans-serif;font-size:14px;color:#333}'
      '.nd-ver-switch select{height:40px;padding:0 36px 0 14px;border:1px solid #E0E0E0;border-radius:12px;background:#fff '
      'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'6\'%3E%3Cpath d=\'M0 0l5 6 5-6z\' fill=\'%23333\'/%3E%3C/svg%3E") no-repeat right 14px center;'
      'font:600 14px "IBM Plex Sans",sans-serif;color:#333;appearance:none;-webkit-appearance:none;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,.06)}'
      '@media (max-width:600px){.nd-ver-switch{display:none}}</style>\n'
      '<div class="nd-ver-switch"><span>Version</span><select aria-label="Prototype version" onchange="location.href=this.value">'
      + opt('calendar.html', 'V2 (latest)') + opt('calendar-v1.html', 'V1') + '</select></div>\n')
