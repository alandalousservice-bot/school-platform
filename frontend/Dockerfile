# مرحلة البناء
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# نُبقي VITE_API_BASE فارغًا افتراضيًا: الواجهة تستدعي مسارات نسبية (/api/...)
# ويتولى nginx تمريرها لحاوية backend — لا حاجة لمعرفة IP الخادم وقت البناء.
ARG VITE_API_BASE=""
ENV VITE_API_BASE=$VITE_API_BASE
RUN npm run build

# مرحلة التقديم
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
