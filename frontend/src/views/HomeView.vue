<script setup>
import { ref, computed } from "vue";

const loading = ref(false);
const error = ref(false);

const products = ref([]);

const SortSettings = {
  Name: 'nom',
  Price: 'prix'
}

const sortSetting = ref(SortSettings.Name);
const filterInput = ref("");

const filteredProducts = computed(() => {
  let nameFiltered = products.value.filter((product) => product.name.toLowerCase().includes(filterInput.value))
  if (sortSetting.value == SortSettings.Name) {
    return nameFiltered.sort((a, b) => a.name.localeCompare(b.name))
  } else {
    return nameFiltered.sort((a, b) => a.originalPrice - b.originalPrice)
  }
})

const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};

async function fetchProducts() {
  loading.value = true;
  error.value = false;

  try {

    const response = await fetch("http://localhost:3000/api/products", {
      method: "GET",
      headers: { "Accept": 'application/json' }
    });


    if (!response.ok) {
      error.value = true;
    } else {
      const fetchedProducts = await response.json();
      products.value = fetchedProducts;
    }
  } catch (e) {
    error.value = true;
  } finally {
    loading.value = false;
  }
}

fetchProducts();
</script>

<template>
  <div>
    <h1 class="text-center mb-4">Liste des produits</h1>

    <div class="row mb-3">
      <div class="col-md-6">
        <form>
          <div class="input-group">
            <span class="input-group-text">Filtrage</span>
            <input
              v-model="filterInput"
              type="text"
              class="form-control"
              placeholder="Filtrer par nom"
              data-test-filter
            />
          </div>
        </form>
      </div>
      <div class="col-md-6 text-end">
        <div class="btn-group">
          <button
            type="button"
            class="btn btn-primary dropdown-toggle"
            data-bs-toggle="dropdown"
            aria-expanded="false"
            data-test-sorter
          >
            Trier par {{ sortSetting }}
          </button>
          <ul class="dropdown-menu dropdown-menu-end">
            <li>
              <a @click="sortSetting = SortSettings.Name" class="dropdown-item" href="#"> Nom </a>
            </li>
            <li>
              <a @click="sortSetting = SortSettings.Price" class="dropdown-item" href="#" data-test-sorter-price>
                Prix
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-center mt-4" data-test-loading>
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Chargement...</span>
      </div>
    </div>

    <div v-if="error" class="alert alert-danger mt-4" role="alert" data-test-error>
      Une erreur est survenue lors du chargement des produits.
    </div>

    <div class="row">
      <div class="col-md-4 mb-4" v-for="product in filteredProducts" data-test-product :key="product.id">
        <div class="card">
          <RouterLink :to="{ name: 'Product', params: { productId: product.id } }">
            <img
              :src=product.pictureUrl
              data-test-product-picture
              class="card-img-top"
            />
          </RouterLink>
          <div class="card-body">
            <h5 class="card-title">
              <RouterLink
                data-test-product-name
                :to="{ name: 'Product', params: { productId: product.id } }"
              >
                {{ product.name }}
              </RouterLink>
            </h5>
            <p class="card-text" data-test-product-description>
              {{ product.description }}
            </p>
            <p class="card-text">
              Vendeur :
              <RouterLink
                data-test-product-seller
                :to="{ name: 'User', params: { userId: product.seller.id } }"
              >
                {{ product.seller.username }}
              </RouterLink>
            </p>
            <p class="card-text" data-test-product-date>
              En cours jusqu'au {{ formatDate(product.endDate) }}
            </p>
            <p class="card-text" data-test-product-price>Prix actuel : {{ product.originalPrice }} €</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
