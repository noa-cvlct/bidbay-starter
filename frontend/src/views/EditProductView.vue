<script setup>
import { useAuthStore } from "../store/auth";
import { useRoute, useRouter } from "vue-router";
import { ref, computed } from "vue";

const { isAuthenticated, token } = useAuthStore();
const router = useRouter();
const route = useRoute();

if (!isAuthenticated.value) {
  router.push({ name: "Login" });
}

const productId = ref(route.params.productId);

const error = ref(false);
const loading = ref(false);

const productName = ref("")
const productDescription = ref("")
const productCategory = ref("")
const productOriginalPrice = ref("")
const productPictureUrl = ref("")
const productEndDate = ref("")

let isFormValid = computed(() => {
  return productName.value != ""
    && productDescription.value != ""
    && productCategory.value != ""
    && productOriginalPrice.value != ""
    && productPictureUrl.value != ""
    && productEndDate.value != ""
})

async function fetchProduct() {
  try {
    const response = await fetch(`http://localhost:3000/api/products/${productId.value}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      const fetchedProduct = await response.json();
      productName.value = fetchedProduct.name
      productDescription.value = fetchedProduct.description
      productCategory.value = fetchedProduct.category
      productOriginalPrice.value = fetchedProduct.originalPrice
      productPictureUrl.value = fetchedProduct.pictureUrl
      let date = new Date(fetchedProduct.endDate).toISOString().split('T')[0]
      productEndDate.value = date.replaceAll("/", "-")
    } else {
      error.value = true;
    }
  } catch (e) {
    error.value = true;
  }
}

async function editProduct() {
  loading.value = true;
  error.value = false;
  try {
    const response = await fetch(`http://localhost:3000/api/products/${productId.value}`, {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${token.value}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        name: productName.value,
        description: productDescription.value,
        pictureUrl: productPictureUrl.value,
        category: productCategory.value,
        originalPrice: productOriginalPrice.value,
        endDate: productEndDate.value
      })
    });

    if (response.ok) {
      router.push({ name: 'Product', params: { productId: productId.value } })
    } else {
      error.value = true;
    }
  } catch(e) {
    error.value = true;
  } finally {
    loading.value = false
  }
}

fetchProduct();
</script>

<template>
  <h1 class="text-center">Modifier un produit</h1>

  <div class="row justify-content-center">
    <div class="col-md-6">
      <form @submit.prevent="editProduct()">
        <div v-if="error" class="alert alert-danger mt-4" role="alert" data-test-error>
          Une erreur est survenue
        </div>

        <div class="mb-3">
          <label for="product-name" class="form-label"> Nom du produit </label>
          <input
            v-model="productName"
            type="text"
            class="form-control"
            id="product-name"
            required
            data-test-product-name
          />
        </div>

        <div class="mb-3">
          <label for="product-description" class="form-label">
            Description
          </label>
          <textarea
            v-model="productDescription"
            class="form-control"
            id="product-description"
            name="description"
            rows="3"
            required
            data-test-product-description
          ></textarea>
        </div>

        <div class="mb-3">
          <label for="product-category" class="form-label"> Catégorie </label>
          <input
            v-model="productCategory"
            type="text"
            class="form-control"
            id="product-category"
            required
            data-test-product-category
          />
        </div>

        <div class="mb-3">
          <label for="product-original-price" class="form-label">
            Prix de départ
          </label>
          <div class="input-group">
            <input
              v-model="productOriginalPrice"
              type="number"
              class="form-control"
              id="product-original-price"
              name="originalPrice"
              step="1"
              min="0"
              required
              data-test-product-price
            />
            <span class="input-group-text">€</span>
          </div>
        </div>

        <div class="mb-3">
          <label for="product-picture-url" class="form-label">
            URL de l'image
          </label>
          <input
            v-model="productPictureUrl"
            type="url"
            class="form-control"
            id="product-picture-url"
            name="pictureUrl"
            required
            data-test-product-picture
          />
        </div>

        <div class="mb-3">
          <label for="product-end-date" class="form-label">
            Date de fin de l'enchère
          </label>
          <input
            v-model="productEndDate"
            type="date"
            class="form-control"
            id="product-end-date"
            name="endDate"
            required
            data-test-product-end-date
          />
        </div>

        <div class="d-grid gap-2">
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="!isFormValid"
            data-test-submit
          >
            Modifier le produit
            <span
              v-if="loading"
              class="spinner-border spinner-border-sm"
              role="status"
              aria-hidden="true"
              data-test-spinner
            ></span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
