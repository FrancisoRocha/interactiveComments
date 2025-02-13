import path from 'path';
import fs from 'fs';
import { glob } from 'glob';
import { src, dest, watch, series } from 'gulp';
import sharp from 'sharp';

// DEPENDENCIAS DE SASS
import sass from 'gulp-dart-sass';
import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';
import sourcemaps from 'gulp-sourcemaps';

// Tarea para compilar SCSS a CSS
export const css = () => {
    return src('./scss/**/*.scss') // Asegúrate de que esta ruta sea correcta
        .pipe(sourcemaps.init())
        .pipe(sass({ outputStyle: 'expanded' }).on('error', sass.logError))
        .pipe(postcss([autoprefixer()]))
        .pipe(sourcemaps.write('.'))
        .pipe(dest('../build/css'));
};

// Procesar imágenes con Sharp
async function procesarImagenes(file, outputSubDir) {
    if (!fs.existsSync(outputSubDir)) {
        fs.mkdirSync(outputSubDir, { recursive: true });
    }
    const baseName = path.basename(file, path.extname(file));
    const extName = path.extname(file);
    const outputFile = path.join(outputSubDir, `${baseName}${extName}`);
    const outputFileWebp = path.join(outputSubDir, `${baseName}.webp`);
    const outputFileAvif = path.join(outputSubDir, `${baseName}.avif`);

    const options = { quality: 80 };

    await sharp(file).jpeg(options).toFile(outputFile);
    await sharp(file).webp(options).toFile(outputFileWebp);
    await sharp(file).avif().toFile(outputFileAvif);
}

// Tarea para optimizar imágenes
export async function imagenes(done) {
    const srcDir = './src/img';
    const buildDir = './build/img';
    const images = await glob('./src/img/**/*.{jpg,png}');

    await Promise.all(images.map(file => {
        const relativePath = path.relative(srcDir, path.dirname(file));
        const outputSubDir = path.join(buildDir, relativePath);
        return procesarImagenes(file, outputSubDir);
    }));

    done();
}

// Función para observar cambios
export const dev = () => {
    watch('./scss/**/*.scss', css);
    watch('./img/**/*', imagenes);
};

// Exportaciones
export default series(imagenes, css, dev);