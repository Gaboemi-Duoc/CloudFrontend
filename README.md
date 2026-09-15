# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
	"$schema": "./node_modules/oxlint/configuration_schema.json",
	"plugins": ["react", "typescript", "oxc"],
	"options": {
		"typeAware": true
	},
	"rules": {
		"react/rules-of-hooks": "error",
		"react/only-export-components": ["warn", { "allowConstantExport": true }]
	}
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

https://cloudfrontend-pi.vercel.app/

Tests:
curl.exe -i "https://ym7ptmkybf.execute-api.us-east-1.amazonaws.com/api/student/courses"

curl.exe -i -H "Authorization: Bearer eyJraWQiOiJZYkNnWCtVMjF1NUErZWNYMFVtZWZCRnRNdU1EZS9QNXlianZtdzRaUUFJPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiIwNGE4OTQ3OC00MDcxLTcwMTctOTFkMi1mZWZmYjViZDljZDgiLCJjb2duaXRvOmdyb3VwcyI6WyJBZG1pbiJdLCJpc3MiOiJodHRwczovL2NvZ25pdG8taWRwLnVzLWVhc3QtMS5hbWF6b25hd3MuY29tL3VzLWVhc3QtMV9OTjZ2amozazUiLCJ2ZXJzaW9uIjoyLCJjbGllbnRfaWQiOiIzOWgyZDE5cTAyN2R2NmdhOW1xZmdwOGY5MCIsIm9yaWdpbl9qdGkiOiJmOTYzZDkyMC1hYThkLTQzODQtYWVlNS1iNWM4MjAxNWE0MmIiLCJ0b2tlbl91c2UiOiJhY2Nlc3MiLCJzY29wZSI6Im9wZW5pZCBlbWFpbCIsImF1dGhfdGltZSI6MTc4OTQ1NjE4OSwiZXhwIjoxNzg5NDU5Nzg5LCJpYXQiOjE3ODk0NTYxODksImp0aSI6ImMxMDNhOGUxLTc0NDktNGQ3MS1iMjQ0LTg5Mjk3MGJmMTM0YSIsInVzZXJuYW1lIjoiMDRhODk0NzgtNDA3MS03MDE3LTkxZDItZmVmZmI1YmQ5Y2Q4In0.MgTT05MzlQ-ZFU9BMA_pVx-gYyXk5vwaKQUlT0MPQw22c5MKrPXVMAiQ7kZY3WdaG6ttdI5aLlbPoF2DijaLlKXCZXNt82zJ1Kyu_EAzsEJkF58VC3YrFqWsHgKbZ5U54XKyTDS0m5x0xSeFG16sfDvMH50blmqNGrTISjGzGJ8mhQTMjTt_qrcYNJbaGyByhPWG_fxQBpzAOhZWKcHKdL8N4BXj8woD7N_i138tkRw_UD7k2Ki_dElTvovidoWM-umsENzMgK2Br_vW8m3Ux2AzSFjihXPFtwjHsHmukNp7ZSIbid7K8S2kzK08zuI_hVaf_5fNuYyO_YkbFvO4Ow" "https://ym7ptmkybf.execute-api.us-east-1.amazonaws.com/api/student/courses"

curl.exe -i -H "Authorization: Bearer eyJraWQiOiJZYkNnWCtVMjF1NUErZWNYMFVtZWZCRnRNdU1EZS9QNXlianZtdzRaUUFJPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiIwNGE4OTQ3OC00MDcxLTcwMTctOTFkMi1mZWZmYjViZDljZDgiLCJjb2duaXRvOmdyb3VwcyI6WyJBZG1pbiJdLCJpc3MiOiJodHRwczovL2NvZ25pdG8taWRwLnVzLWVhc3QtMS5hbWF6b25hd3MuY29tL3VzLWVhc3QtMV9OTjZ2amozazUiLCJ2ZXJzaW9uIjoyLCJjbGllbnRfaWQiOiIzOWgyZDE5cTAyN2R2NmdhOW1xZmdwOGY5MCIsIm9yaWdpbl9qdGkiOiJmOTYzZDkyMC1hYThkLTQzODQtYWVlNS1iNWM4MjAxNWE0MmIiLCJ0b2tlbl91c2UiOiJhY2Nlc3MiLCJzY29wZSI6Im9wZW5pZCBlbWFpbCIsImF1dGhfdGltZSI6MTc4OTQ1NjE4OSwiZXhwIjoxNzg5NDU5Nzg5LCJpYXQiOjE3ODk0NTYxODksImp0aSI6ImMxMDNhOGUxLTc0NDktNGQ3MS1iMjQ0LTg5Mjk3MGJmMTM0YSIsInVzZXJuYW1lIjoiMDRhODk0NzgtNDA3MS03MDE3LTkxZDItZmVmZmI1YmQ5Y2Q4In0.MgTT05MzlQ-ZFU9BMA_pVx-gYyXk5vwaKQUlT0MPQw22c5MKrPXVMAiQ7kZY3WdaG6ttdI5aLlbPoF2DijaLlKXCZXNt82zJ1Kyu_EAzsEJkF58VC3YrFqWsHgKbZ5U54XKyTDS0m5x0xSeFG16sfDvMH50blmqNGrTISjGzGJ8mhQTMjTt_qrcYNJbaGyByhPWG_fxQBpzAOhZWKcHKdL8N4BXj8woD7N_i138tkRw_UD7k2Ki_dElTvovidoWM-umsENzMgK2Br_vW8m3Ux2AzSFjihXPFtwjHsHmukNp7ZSIbid7K8S2kzK08zuI_hVaf_5fNuYyO_YkbFvO4Ow" "https://ym7ptmkybf.execute-api.us-east-1.amazonaws.com/api/me"