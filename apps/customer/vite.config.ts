import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
export default defineConfig({server:{host:'127.0.0.1',port:3000,strictPort:true},build:{sourcemap:false,rollupOptions:{input:{account:fileURLToPath(new URL('./index.html',import.meta.url)),showroom:fileURLToPath(new URL('./showroom.html',import.meta.url))}}}});
